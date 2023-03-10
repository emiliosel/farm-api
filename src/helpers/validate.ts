import { ClassConstructor, instanceToPlain, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { UnprocessableEntityError } from "errors/errors";

export async function transformInputAndValidate<T>(input: unknown, dtoClass: new () => T): Promise<T> {
  const dtoObject = plainToInstance(dtoClass, input);
  const errors: ValidationError[] = await validate(dtoObject as object);

  if (errors.length > 0) {
    const readableErrors = errors.map(error => {
      const constraints = error.constraints;
      if (constraints) {
        return Object.values(constraints).join("; ");
      }
      return error.toString();
    });

    throw new UnprocessableEntityError(readableErrors.join("\n "));
  }
  return dtoObject;
}

export function transformOutput<T>(obj: object, toInstance: ClassConstructor<T>) {
  const instance = plainToInstance(toInstance, obj);
  return instanceToPlain(instance, { strategy: "excludeAll" });
} 
