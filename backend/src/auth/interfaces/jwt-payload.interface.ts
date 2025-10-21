export interface JwtPayload {
  sub: string; // userId
  email: string;
  companyId: string | null;
  role: string;
}
