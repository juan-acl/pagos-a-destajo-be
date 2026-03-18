import { DefaultNamingStrategy, NamingStrategyInterface, Table } from "typeorm";

export const PrefixNamingStrategy = class
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  readonly DB_PREFIX = "DES";

  readonly TABLE_PREFIXES: Record<string, string> = {
    PUESTO:                     "PST",
    AREA:                       "ARE",
    EMPLEADO:                   "EMP",
    CUADRILLA:                  "CUA",
    MIEMBRO_CUADRILLA:          "MIC",
    ORDEN_TRABAJO:              "ODT",
    ASIGNACION_ORDEN_CUADRILLA: "TAC",
    ASIGNACION_EMPLEADO:        "ASE",
    LOTE_PRODUCCION:            "LTP",
    REVISION_PRODUCCION:        "RVP",
    PAGO_PLANILLA:              "PGP",
    MEDIDAS:                    "MED",
  };
   classPrefixMap = new Map<string, string>();
  currentTargetName?: string;

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
    const snake = this.toSnakeUpper(targetName);
    const prefix = this.TABLE_PREFIXES[snake] ?? snake.substring(0, 3);
    this.classPrefixMap.set(targetName, prefix);
    this.currentTargetName = targetName;

    if (userSpecifiedName) {
      this.classPrefixMap.set(targetName, this.extractTablePrefix(userSpecifiedName));
      return userSpecifiedName;
    }

    return `${this.DB_PREFIX}_${snake}`;
  }

  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[]
  ): string {
    if (customName) return customName;
    const col = this.toSnakeUpper(propertyName);

    const className = embeddedPrefixes[0] ?? this.currentTargetName;
    const prefix = className
      ? (this.classPrefixMap.get(className) ?? this.extractTablePrefix(className))
      : "UNK";

    return `${prefix}_${col}`;
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `PK_${table}`;
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `UQ_${table}_${columnNames.join("_")}`;
  }

  relationConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `REL_${table}_${columnNames.join("_")}`;
  }

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    _referencedTablePath?: string,
    _referencedColumnNames?: string[]
  ): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `FK_${table}_${columnNames.join("_")}`;
  }

  indexName(tableOrName: Table | string, columnNames: string[]): string {
    const table = tableOrName instanceof Table ? tableOrName.name : tableOrName;
    return `IDX_${table}_${columnNames.join("_")}`;
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    const rel = this.toSnakeUpper(relationName).substring(0, 3);
    return `${rel}_${this.toSnakeUpper(referencedColumnName)}`;
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    _firstPropertyName: string,
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
    return tableOrName.toString()
  }

};