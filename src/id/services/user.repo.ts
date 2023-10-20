import { User } from '../models/user.js';

export interface UserRepo {
  get(id: string): Promise<User | undefined>;
  findByUserName(userName: string): Promise<User | undefined>;
  save(user: User): Promise<void>;
  delete(user: User): Promise<boolean>;
}
