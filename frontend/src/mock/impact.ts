import type { ImpactResult } from '../types';

export const mockImpactResult: ImpactResult = {
  changed_object: 'users.email',
  affectedCount: 3,
  components: [
    {
      component: 'User.email',
      type: 'orm_model',
      file: 'models.py',
      line: 17,
      relationship: "Maps database column 'email' to SQLAlchemy model attribute",
      severity: 'High',
    },
    {
      component: 'UserResponse.email',
      type: 'pydantic_schema',
      file: 'schemas.py',
      line: 12,
      relationship: "Serializes field 'email' in outbound API JSON responses",
      severity: 'High',
    },
    {
      component: 'GET /users/{id}',
      type: 'fastapi_route',
      file: 'routes.py',
      line: 12,
      relationship: "Declared response_model=UserResponse contract fails or sends undefined attributes",
      severity: 'High',
    },
  ],
};
