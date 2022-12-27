import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { checkDuplicacy, checkName, insertPipeline, insertSchema } from 'src/specifications/queries/queries';
import { DataSource } from 'typeorm';
import { GenericFunction } from '../genericFunction';
@Injectable()
export class EventService {
    constructor(@InjectDataSource() private dataSource: DataSource, private specService: GenericFunction) {
    }
    async createEvent(speceventDTO) {
        const queryRunner = this.dataSource.createQueryRunner()
        let newObj = this.specService.convertKeysToLowerCase(speceventDTO);
        if (speceventDTO?.event_name.toLowerCase() == "") {
            return { "code": 400, "message": "Event Name cannot be empty" };
        }
        if (newObj?.ingestion_type == "") {
            return { "code": 400, "message": "Ingestion Type cannot be empty" };
        }
        let queryResult = checkName('event_name', "event");
        queryResult = queryResult.replace('$1', `${speceventDTO?.dimension_name.toLowerCase()}`)
        const resultDname = await this.dataSource.query(queryResult);
        if (resultDname.length > 0) {
            return { "code": 400, "message": "Event Name already exists" };
        }
        else {
            await queryRunner.connect();
            let values = newObj?.input?.properties?.dimension;
            let duplicacyQuery = checkDuplicacy(['event_name', 'event_data'], 'event', ['event_data', 'input', 'properties', 'event'], JSON.stringify(values));
            console.log("The query is:", duplicacyQuery);
            const result = await queryRunner.query(duplicacyQuery);
            console.log("The result is:", result);
            if (result.length == 0) //If there is no record in the DB then insert the first schema
            {
                await queryRunner.startTransaction();
                try {
                    let insertQuery = insertSchema(['event_name', 'event_data'], 'event');
                    insertQuery = insertQuery.replace('$1', `'${speceventDTO.event_name.toLowerCase()}'`);
                    insertQuery = insertQuery.replace('$2', `'${JSON.stringify(newObj)}'`);
                    const insertResult = await queryRunner.query(insertQuery);
                    if (insertResult[0].pid) {
                        let event_pid = (insertResult[0].pid).toString();
                        const pipeline_name = speceventDTO.dimension_name.toLowerCase() + 'pipeline';
                        let insertPipeLineQuery = insertPipeline(['pipeline_name', 'dimension_pid'], 'pipeline', [pipeline_name, event_pid]);
                        const insertPipelineResult = await queryRunner.query(insertPipeLineQuery);
                        if (insertPipelineResult[0].pid) {
                            await queryRunner.commitTransaction();
                            return { "code": 200, "message": "Event Spec Created Successfully", "event_name": speceventDTO.event_name, "pid": insertResult[0].pid };
                        }
                        else {
                            return { "code": 400, "message": "Something went wrong" };
                        }
                    }
                    else {
                        await queryRunner.rollbackTransaction()
                        return { "code": 400, "message": "Something went wrong" };
                    }
                }
                catch (error) {
                    await queryRunner.rollbackTransaction()
                    return { "code": 400, "message": "something went wrong" }
                }
                finally {
                    await queryRunner.release();
                }
            }
            else {
                return { "code": 400, "message": "Duplicate dimension not allowed" }
            }
        }
    }
}
