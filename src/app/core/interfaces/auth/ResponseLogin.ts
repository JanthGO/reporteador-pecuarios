import { User } from './User';

export interface ResponseLogin{
    statusCode: number;
    data: User;
}
