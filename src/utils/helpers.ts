export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function mapRowToEntity<T>(row: any): T {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    return row;
  }
  const entity: any = {};
  for (const key of Object.keys(row)) {
    entity[snakeToCamel(key)] = row[key];
  }
  return entity as T;
}

export function mapEntityToRow(entity: any): any {
  if (entity === null || typeof entity !== 'object' || Array.isArray(entity)) {
    return entity;
  }
  const row: any = {};
  for (const key of Object.keys(entity)) {
    row[camelToSnake(key)] = entity[key];
  }
  return row;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isStrongPassword(password: string): boolean {
  // at least 8 chars, 1 uppercase, 1 lowercase, 1 number
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}
