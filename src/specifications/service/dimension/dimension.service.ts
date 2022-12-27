import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { GenericFunction } from './../genericFunction';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { checkDuplicacy, checkName, createTable, insertSchema } from 'src/specifications/queries/queries';
export class DimensionService {
    constructor(private dbService: DatabaseService, private specService:GenericFunction, private configService: ConfigService) {   
    }
    async createDimension(dimensionDTO) {
        let dbColumns = []
        let newObj = this.specService.convertKeysToLowerCase(dimensionDTO);
        if (dimensionDTO?.dimension_name.toLowerCase() == "") {
            return {"code":400, "message": "Dimension Name cannot be empty" };
        }
        const resultDname = await this.dbService.executeQuery(checkName('dimension_name', "dimension"), [dimensionDTO?.dimension_name.toLowerCase()]);
        if (resultDname.length > 0) {
            return {"code":400, "message": "Dimension Name already exists" };
        }
        else {
            let values = newObj?.input?.properties?.dimension;
            const result = await this.dbService.executeQuery(checkDuplicacy(['dimension_name', 'dimension_data'], 'dimension', ['dimension_data', 'input', 'properties', 'dimension']), [JSON.stringify(values)]);
            if (result.length == 0) //If there is no record in the DB then insert the first schema
            {
                try{
                    const insertResult = await this.dbService.executeQuery(insertSchema(['dimension_name', 'dimension_data'], 'dimension'), [2, dimensionDTO.dimension_name.toLowerCase(), newObj]);
                    if (insertResult[0].pid) {
                        const dimension_pid = insertResult[0].pid;
                        const pipeline_name = dimensionDTO.dimension_name.toLowerCase() + 'pipeline';
                        const insertPipelineResult = await this.dbService.executeQuery(insertSchema(['pipeline_name','dimension_pid'], 'pipeline'), [2, pipeline_name, dimension_pid]);
                        if(insertPipelineResult[0].pid)
                        {
                        let columnProperties = []
                        let columnNames = [];
                        columnNames.push(Object.keys(values?.properties));
                        columnProperties.push(Object.values(values?.properties))
                        let dbColumns = this.specService.getDbColumnNames(columnProperties[0]);
                        let tbName: string = newObj?.ingestion_type;
                        let query = createTable(tbName, columnNames[0], dbColumns);
                        console.log("query is:", query);
                        const createResult = await this.dbService.executeQuery(query, []);
                        return {"code":200, "message": "Dimension Spec Created Successfully", "dimension_name": dimensionDTO.dimension_name, "pid": insertResult[0].pid };
                        }
                    }
                    else{
                        return {"code":400, "message":"Something went wrong"};

                    }

                }
                catch(error)
                {
                    return{"code":400, "message":"something went wrong"}
                }
                finally
                {
                    
                }
                
                
            }
            else {
                return {"code":400, "message": "Duplicate dimension not allowed" }
            }
        }
    }
}