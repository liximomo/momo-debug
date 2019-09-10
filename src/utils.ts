export function isPlainObject(obj: any): obj is object {
  return obj !== null && typeof obj === 'object';
}

export function assert(value: any, message?: string): void {
  console.assert(value, message);
}

export function parsePropsPath(propsPath: string): string[] {
  return propsPath.replace(/\[(.+?)\]/g, '.$1').split('.');
}
