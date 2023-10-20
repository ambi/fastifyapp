export enum AuthenticationResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export interface Session {
  authenticationResult?: AuthenticationResult | null;
  userId?: string | null;
  postSignin?: string | null;
  postSigninParams?: any;
}
