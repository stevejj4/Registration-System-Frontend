export interface CountyDTO {
  id: number;
  name: string;
  region?: string;
}

export interface SubCountyDTO {
  id: number;
  countyId: number;
  name: string;
}

export interface WardDTO {
  id: number;
  subCountyId: number;
  name: string;
}
