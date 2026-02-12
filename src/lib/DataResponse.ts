import { PageMetaData } from "./PageMetaData";
import { ResponseStatus } from "./ResponseStatus";

export interface DataResponse {
  status: ResponseStatus;
  data: any;
  meta_data: PageMetaData;
}
