import { IRouter } from './IRouter'
import { Container, Service } from 'typedi'
import { HttpMethod } from '../../types/HttpMethod'
import { MetadataStorage } from '../../metadata/MetadataStorage/MetadataStorage'
import { Controller } from '../Controller/Controller'
import { flatten, groupBy } from 'lodash'
import { RequestHandler } from '../../types/RequestHandler'
import { ControllerInstance } from '../../types/ControllerInstance'
import { formatRoute } from '../../utils/formatRoute'
import { Request } from '../../types/Request'
import { Response } from '../../types/Response'
import { IAction } from '../Action/IAction'

@Service()
export class Router implements IRouter {
  private _actionsMap = new Map<HttpMethod, IAction[]>()

  constructor(
    private readonly _metadataStorage: MetadataStorage
  ) {}

  getHandler(route: string, method: HttpMethod): RequestHandler | null {
    const actions = this._actionsMap.get(method as HttpMethod)

    if (!actions) {
      return null
    }

    let action: IAction | null = null
    let params: Record<string, string> = {}

    for (const a of actions) {
      const result = a.matchRoute(formatRoute(route))
      if (result) {
        action = a
        params = result.params as Record<string, string>
        break
      }
    }

    if (!action) {
      return null
    }

    const { target, methodName } = action
    const controllerInstance = Container.get<ControllerInstance>(target)

    return this.createHandler(controllerInstance, methodName, params)
  }

  mapRoutes() {
    const controllers: Controller[] = this._metadataStorage.getControllersMetadata().map(
      (controllerMetadata) => new Controller(controllerMetadata)
    )

    const actionsByHttpMethod = groupBy(flatten(controllers.map((controller) => controller.actions)), 'httpMethod')

    for (const httpMethod in actionsByHttpMethod) {
      this._actionsMap.set(httpMethod as HttpMethod, actionsByHttpMethod[httpMethod])
    }
  }

  private createHandler(
    controllerInstance: ControllerInstance, methodName: string, params: Record<string, string>
  ): RequestHandler {
    return function(req: Request, res: Response) {
      req.params = Object.assign({}, params)
      // eslint-disable-next-line no-useless-call
      return controllerInstance[methodName]
        .call<ControllerInstance, [Request, Response], unknown | Promise<unknown>>(
          controllerInstance, req, res
        )
    }
  }
}
