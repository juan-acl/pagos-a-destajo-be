import { DefaultNamingStrategy, NamingStrategyInterface, Table } from "typeorm";

export const PrefixNamingStrategy = class
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
   readonly DB_PREFIX = "DES";
   currentTablePrefix = "";

   readonly TABLE_PREFIXES: Record<string, string> = {
    PUESTO:                       "PST",
    AREA:                         "ARE",
    EMPLEADO:                     "EMP",
    CUADRILLA:                    "CUA",
    MIEMBRO_CUADRILLA:            "MIC",
    ORDEN_TRABAJO:                "ODT",
    ASIGNACION_ORDEN_CUADRILLA:   "TAC",
    ASIGNACION_EMPLEADO:          "ASE",
    LOTE_PRODUCCION:              "LTP",
    REVISION_PRODUCCION:          "RVP",
    PAGO_PLANILLA:                "PGP",
    MEDIDAS:                      "MED",
  };

   toSnakeUpper(str: string): string {
    return str
      .replace(/([A-Z])/g, "_$1")
      .toUpperCase()
      .replace(/^_/, "");
  }

   extractTablePrefix(tableName: string): string {
    const withoutDB = tableName.replace(/^DES_/, "");
    return this.TABLE_PREFIXES[withoutDB] ?? withoutDB.substring(0, 3);
  }

  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    if (userSpecifiedName) {
      this.currentTablePrefix = this.extractTablePrefix(userSpecifiedName);
      return userSpecifiedName;
    }
    const snake = this.toSnakeUpper(targetName);
    this.currentTablePrefix = this.TABLE_PREFIXES[snake] ?? snake.substring(0, 3);
    return `${this.DB_PREFIX}_${snake}`;
  }

  columnName(
    propertyName: string,
    customName: string | undefined,
    _embeddedPrefixes: string[]
  ): string {
    if (customName) return customName;
    const col = this.toSnakeUpper(propertyName);
    return `${this.currentTablePrefix}_${col}`;
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `PK_${table}`;
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const cols = columnNames.join("_");
    return `UQ_${table}_${cols}`;
  }

  relationConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const cols = columnNames.join("_");
    return `REL_${table}_${cols}`;
  }

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    _referencedTablePath?: string,
    _referencedColumnNames?: string[]
  ): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const cols = columnNames.join("_");
    return `FK_${table}_${cols}`;
  }

  indexName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    const cols = columnNames.join("_");
    return `IDX_${table}_${cols}`;
  }

  checkConstraintName(tableOrName: Table | string, expression: string): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `CHK_${table}_${expression.substring(0, 20).replace(/\s/g, "_")}`;
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    const rel = this.toSnakeUpper(relationName).substring(0, 3);
    return `${rel}_${this.toSnakeUpper(referencedColumnName)}`;
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    _secondPropertyName: string
  ): string {
    return `${firstTableName}_${secondTableName}`;
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string
  ): string {
    const prefix = this.extractTablePrefix(tableName);
    return `${prefix}_${this.toSnakeUpper(columnName ?? propertyName)}`;
  }

   getTableName(tableOrName: Table | string): string {
    if(tableOrName instanceof Table) return tableOrName.name;
    return tableOrName.substring(0, 3).toUpperCase();
  }

};