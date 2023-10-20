import { MemoryDb, MemoryDbOptions } from '../../db/memory-db.js';
import { User } from '../models/user.js';
import { UserRepo } from '../services/user.repo.js';

export class Users implements UserRepo {
  private db: MemoryDb<User>;

  constructor() {
    const options: MemoryDbOptions<User> = {
      // serialize,
      // deserialize,
      secondaryKeys: ['userName'],
    };
    this.db = new MemoryDb(options);
  }

  async get(id: string): Promise<User | undefined> {
    return await this.db.get(id);
  }

  async findByUserName(userName: string): Promise<User | undefined> {
    return await this.db.findBy('userName', userName);
  }

  async save(user: User): Promise<void> {
    await this.db.save(user);
  }

  async delete(user: User): Promise<boolean> {
    return this.db.delete(user);
  }
}
