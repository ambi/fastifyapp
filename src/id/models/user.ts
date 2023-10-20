export interface User {
  id: string;
  userName: string;
  passwordHash: string;
  attrs: { [key: string]: any };
}
