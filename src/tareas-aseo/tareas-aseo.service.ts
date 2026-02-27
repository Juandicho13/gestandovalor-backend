import { Injectable } from '@nestjs/common';
import { CreateTareasAseoDto } from './dto/create-tareas-aseo.dto';
import { UpdateTareasAseoDto } from './dto/update-tareas-aseo.dto';

@Injectable()
export class TareasAseoService {
  create(createTareasAseoDto: CreateTareasAseoDto) {
    return 'This action adds a new tareasAseo';
  }

  findAll() {
    return `This action returns all tareasAseo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tareasAseo`;
  }

  update(id: number, updateTareasAseoDto: UpdateTareasAseoDto) {
    return `This action updates a #${id} tareasAseo`;
  }

  remove(id: number) {
    return `This action removes a #${id} tareasAseo`;
  }
}
