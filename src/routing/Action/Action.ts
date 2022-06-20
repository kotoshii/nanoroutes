import { IAction } from './IAction'
import { IController } from '../Controller/IController'
import { IActionMetadata } from '../../metadata/IActionMetadata'
import { HttpMethod } from '../../types/HttpMethod'
import path from 'path/posix'
import { formatRoute } from '../../utils/formatRoute'

export class Action implements IAction {
  controller: IController

  target: Function

  httpMethod: HttpMethod

  methodName: string

  route: string

  fullRoute: string

  constructor(controller: IController, { target, httpMethod, methodName, route }: IActionMetadata) {
    this.controller = controller
    this.target = target.constructor
    this.httpMethod = httpMethod
    this.methodName = methodName
    this.route = route
    this.fullRoute = this.buildRoute()
  }

  private buildRoute() {
    return formatRoute(path.join(this.controller.basePath, this.route))
  }
}