export function checkName(coulmnName: string, tableName: string) {
    const querStr = `SELECT ${coulmnName} FROM spec.${tableName} WHERE ${coulmnName} = '$1'`;
    return querStr
}

export function checkDuplicacy(columnNames: string[], tableName: string, JsonProperties: string[], conditionData) {
    const querStr = `SELECT ${columnNames[0]},${columnNames[1]} FROM spec.${tableName} WHERE (${JsonProperties[0]}->${JsonProperties[1]}) ::jsonb = ('${conditionData}') ::jsonb `;
    return querStr;
}

export function insertSchema(columnNames: string[], tableName: string) {
    const queryStr = `INSERT INTO spec.${tableName}(${columnNames[0]}, ${columnNames[1]}) VALUES ($1,$2) RETURNING pid`;
    console.log('queries.insertSchema: ', queryStr);
    return queryStr;
}

export function insertPipeline(columnNames: string[], tableName: string, columnValues: any[]) {
    const queryStr = `INSERT INTO spec.${tableName}(${columnNames[0]}, ${columnNames[1]}) VALUES ('${columnValues[0]}',${columnValues[1]}) RETURNING pid`;
    console.log('queries.insertPipeline: ', queryStr);
    return queryStr;
}

export function createSchema() {
    const queryStr = "CREATE SCHEMA IF NOT EXISTS ingestion";
    return queryStr;
}

export function createTable(tableName: string, columnNames: string[], dbColProperties: string[]) {
    let createSubQuery = '';
    let createQueryStr = `CREATE TABLE IF NOT EXISTS ingestion.${tableName} (pid  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            is_deleted BOOLEAN   DEFAULT FALSE,
            event_by   INT NOT NULL,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `;
    console.log('queries.createTable: ', createQueryStr, columnNames.length, dbColProperties.length);
    if (columnNames.length == dbColProperties.length) {
        for (let i = 0; i < columnNames.length; i++) {
            if (i < columnNames.length - 1) {
                createSubQuery = '';
                createSubQuery += columnNames[i] + ' ' + dbColProperties[i] + ',';
                createQueryStr += createSubQuery;
            }
            else {
                createSubQuery = '';
                createSubQuery += columnNames[i] + ' ' + dbColProperties[i] + ');';
                createQueryStr += createSubQuery;
            }
        }
        console.log('queries.createTable: ', createSubQuery);
        return createQueryStr;
    }
}

export function insertTransformer(transformer_file: string) {
    const queryStr = `INSERT INTO spec.transformer(transformer_file) VALUES ('${transformer_file}') 
    ON CONFLICT ON CONSTRAINT transformer_transformer_file_key 
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING pid; `;
    return queryStr;
}

export function getEventData(eventName: string) {
    const queryStr = `SELECT event_name FROM spec.event WHERE event_name = '${eventName}'`;
    return queryStr;
}

export function getdatasetName(datasetName: string) {
    const queryStr = `SELECT dataset_name FROM spec.dataset where dataset_name='${datasetName}'`;
    return queryStr;
}
