import {
  Repository,
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
} from "typeorm";

export class BaseRepository<T> {
  constructor(protected readonly repo: Repository<T>) { }

  findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repo.find(options);
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repo.findOne(options);
  }

  findById(id: number): Promise<T | null> {
    return this.repo.findOne({ where: { id } as any });
  }

  create(data: DeepPartial<T>): T {
    return this.repo.create(data);
  }

  save(data: DeepPartial<T>): Promise<T> {
    return this.repo.save(data as any);
  }

  async update(id: number, data: DeepPartial<T>): Promise<T | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  count(options?: FindManyOptions<T>): Promise<number> {
    return this.repo.count(options);
  }
}