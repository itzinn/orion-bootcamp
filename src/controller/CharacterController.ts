import { Request, Response } from 'express';
import { User } from '../entity/User';
import { MysqlDataSource } from '../config/database';
import { Character } from '../entity/Character';
import { Metrics } from '../entity/Metrics';
import { Comic } from '../entity/Comic';
import { Series } from '../entity/Series';
import { Story } from '../entity/Story';

enum Category {
  Characters = 'characters',
  Comics = 'comics',
  Series = 'series',
  Stories = 'stories',
  Events = 'events'
}

export class CharacterController {
  /**
   * @swagger
   *
   * /v1/select/{character_id}:
   *   get:
   *     summary: Requisita informações sobre personagem
   *     description: Retorna detalhes sobre um personagem selecionado e realiza a contabilização da métrica de cliques por usuário por card
   *     security:
   *       - BearerAuth: []
   *     tags: [Characters]
   *     parameters:
   *       - in: path
   *         name: character_id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: o ID do personagem
   *     responses:
   *       '200':
   *           description: 'Requisição bem sucedida.'
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   date:
   *                     type: object
   *                   status:
   *                     type: boolean
   *                   data:
   *                     type: string
   *                     description: 'objeto json de retorno'
   *               example:
   *                 date: {}
   *                 status: true
   *                 data: 'O usuário 4 selecionou o personagem 1'
   *       '404':
   *           description: 'Requisição falhou.'
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   date:
   *                     type: object
   *                   status:
   *                     type: boolean
   *                   data:
   *                     type: string
   *                     description: 'objeto json de retorno'
   *               example:
   *                 date: {}
   *                 status: false
   *                 data: "Personagem não encontrado."
   *       '500':
   *           description: 'Erro interno.'
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   date:
   *                     type: object
   *                   status:
   *                     type: boolean
   *                   data:
   *                     type: string
   *                     description: 'objeto json de retorno'
   *               example:
   *                 date: {}
   *                 status: false
   *                 data: "Um erro interno ocorreu."
   *
   */
  async countClick(req: Request, res: Response) {
    try {
      const character_id: number = Number(req.params.character_id);
      const user_id: number = req.body.user.id;

      const userRepository = MysqlDataSource.getRepository(User);
      const characterRepository = MysqlDataSource.getRepository(Character);
      const metricsRepository = MysqlDataSource.getRepository(Metrics);

      //procura para ver se a métrica já existe
      const metric = await metricsRepository.findOne({
        where: { user: { id: user_id }, character: { id: character_id } }
      });

      if (metric) {
        metric.clicks += 1;

        await metricsRepository.save(metric);
      } else {
        //find no usuario
        const user: User = await userRepository.findOne({
          where: {
            id: user_id
          }
        });

        if (!user) {
          return res.status(404).send({
            date: new Date(),
            status: false,
            data: 'Usuário não encontrado.'
          });
        }

        //find no personagem
        const character: Character = await characterRepository.findOne({
          where: {
            id: character_id
          }
        });

        if (!character) {
          return res.status(404).send({
            date: new Date(),
            status: false,
            data: 'Personagem não encontrado.'
          });
        }

        //cria nova métrica na tabela
        const metricsEntry = new Metrics();
        metricsEntry.user = user;
        metricsEntry.character = character;
        metricsEntry.clicks = 1;

        await MysqlDataSource.manager.save(metricsEntry);
      }

      return res.status(200).send({
        date: new Date(),
        status: true,
        data:
          'O usuário ' +
          req.body.user.id +
          ' selecionou o personagem ' +
          character_id
      });
    } catch (error) {
      return res.status(500).send({
        date: new Date(),
        status: false,
        data: 'Um erro interno ocorreu.'
      });
    }
  }

  /**
   * @swagger
   *
   * /v1/getPage/{category}/{page}:
   *   get:
   *     summary: Requisita páginas de uma categoria especificada
   *     description: Retorna uma quantidade de 9 cards por página da categoria especificada
   *     security:
   *       - BearerAuth: []
   *     tags: [Characters]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum:
   *             - characters
   *             - comics
   *             - series
   *             - stories
   *             - events
   *         description: Categoria desejada
   *       - in: path
   *         name: page
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Página desejada
   *     responses:
   *       '200':
   *           description: 'Requisição bem sucedida.'
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   date:
   *                     type: object
   *                   status:
   *                     type: boolean
   *                   data:
   *                     type: string
   *                     description: 'objeto json de retorno'
   *               example:
   *                 date: {}
   *                 status: true
   *                 data: <ARRAY DE OBJETOS JSON>
   *       '404':
   *           description: 'Requisição falhou.'
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   date:
   *                     type: object
   *                   status:
   *                     type: boolean
   *                   data:
   *                     type: string
   *                     description: 'objeto json de retorno'
   *               example:
   *                 date: {}
   *                 status: false
   *                 data: "Página não encontrada."
   *       '500':
   *           description: 'Erro interno.'
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   date:
   *                     type: object
   *                   status:
   *                     type: boolean
   *                   data:
   *                     type: string
   *                     description: 'objeto json de retorno'
   *               example:
   *                 date: {}
   *                 status: false
   *                 data: "Um erro interno ocorreu."
   *
   */
  async getPage(req: Request, res: Response) {
    try {
      const pageCategory: Category = req.params.category as Category;
      const page: number = Number(req.query.page);

      const offset = (page - 1) * 9;
      const limit = 9;

      let cards;

      switch (pageCategory) {
        case Category.Characters:
          const charactersRepository = MysqlDataSource.getRepository(Character);

          cards = await charactersRepository.find({
            take: limit,
            skip: offset
          });

          break;

        case Category.Comics:
          const comicsRepository = MysqlDataSource.getRepository(Comic);

          cards = await comicsRepository.find({
            take: limit,
            skip: offset
          });

          break;

        case Category.Series:
          const seriesRepository = MysqlDataSource.getRepository(Series);

          cards = await seriesRepository.find({
            take: limit,
            skip: offset
          });

          break;

        case Category.Stories:
          const storiesRepository = MysqlDataSource.getRepository(Story);

          cards = await storiesRepository.find({
            take: limit,
            skip: offset
          });

          break;
        case Category.Events:
          const eventsRepository = MysqlDataSource.getRepository(Event);

          cards = await eventsRepository.find({
            take: limit,
            skip: offset
          });

          break;
      }

      if (cards.length === 0) {
        return res.status(404).send({
          date: new Date(),
          status: false,
          data: 'Página não encontrada.'
        });
      }

      return res
        .status(200)
        .json({ date: new Date(), status: true, data: cards });
    } catch (error) {
      return res.status(500).send({
        date: new Date(),
        status: false,
        data: 'Um erro interno ocorreu.'
      });
    }
  }
}
