// Make a GraphQL generated readonly type fully writable for use with immer's Draft types.
export type DeepWritable<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? Array<DeepWritable<U>>
  : T extends ReadonlyArray<infer U>
  ? Array<DeepWritable<U>>
  : T extends object
  ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
  : T;

export default DeepWritable;
