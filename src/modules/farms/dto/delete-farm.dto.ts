import { IsUUID } from "class-validator";

export class DeleteFarmInputDto {
  
  @IsUUID()
  public userId: string;

  @IsUUID()
  public farmId: string;

} 
