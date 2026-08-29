# Class Diagram — SIKAGIG

> Representasi struktur kelas untuk layer Backend (Express + Prisma)
> Fokus pada: Controller, Service, dan Model layer

---

## Diagram (Teks)

```
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLERS                             │
├───────────────┬───────────────┬────────────┬───────────────┤
│AuthController │ GigController │ProposalCtrl│ProfileCtrl    │
├───────────────┼───────────────┼────────────┼───────────────┤
│+register()    │+getAll()      │+send()     │+getMyProfile()│
│+login()       │+getById()     │+getAll()   │+updateProfile()│
│+logout()      │+create()      │+getById()  │+getPublic()   │
│+me()          │+update()      │+updateStatus()│            │
│+refresh()     │+remove()      │+withdraw() │               │
└───────┬───────┴───────┬───────┴─────┬──────┴───────────────┘
        │               │             │
        ▼               ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES                               │
├───────────────┬───────────────┬────────────┬───────────────┤
│AuthService    │ GigService    │ProposalSvc │ProfileService │
├───────────────┼───────────────┼────────────┼───────────────┤
│+register()    │+findMany()    │+create()   │+findByUserId()│
│+login()       │+findById()    │+findMany() │+update()      │
│+logout()      │+create()      │+findById() │+findPublic()  │
│+verifyToken() │+update()      │+accept()   │               │
│+refreshToken()│+remove()      │+reject()   │               │
│+hashPassword()│               │+withdraw() │               │
│+generateTokens()│             │            │               │
└───────┬───────┴───────┬───────┴─────┬──────┴───────────────┘
        │               │             │
        ▼               ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRISMA CLIENT                            │
│              (Database Access Layer)                        │
├────────────────────────────────────────────────────────────┤
│  prisma.user | prisma.profile | prisma.gig                 │
│  prisma.proposal | prisma.category | prisma.refreshToken   │
└────────────────────────────────────────────────────────────┘
```

---

## Detail Kelas

### AuthController

```typescript
class AuthController {
  async register(req: Request, res: Response): Promise<void>;
  async login(req: Request, res: Response): Promise<void>;
  async logout(req: Request, res: Response): Promise<void>;
  async me(req: Request, res: Response): Promise<void>;
  async refresh(req: Request, res: Response): Promise<void>;
}
```

### AuthService

```typescript
class AuthService {
  async register(data: RegisterDto): Promise<{ user: User; tokens: Tokens }>;
  async login(data: LoginDto): Promise<{ user: User; tokens: Tokens }>;
  async logout(userId: string, refreshToken: string): Promise<void>;
  async refreshToken(token: string): Promise<Tokens>;
  private async hashPassword(password: string): Promise<string>;
  private async comparePassword(plain: string, hash: string): Promise<boolean>;
  private generateAccessToken(userId: string, role: Role): string;
  private generateRefreshToken(): string;
}
```

### GigController

```typescript
class GigController {
  async getAll(req: Request, res: Response): Promise<void>;
  async getById(req: Request, res: Response): Promise<void>;
  async create(req: Request, res: Response): Promise<void>;
  async update(req: Request, res: Response): Promise<void>;
  async remove(req: Request, res: Response): Promise<void>;
}
```

### GigService

```typescript
class GigService {
  async findMany(filters: GigFilters): Promise<{ gigs: Gig[]; total: number }>;
  async findById(id: string): Promise<Gig>;
  async create(clientId: string, data: CreateGigDto): Promise<Gig>;
  async update(id: string, clientId: string, data: UpdateGigDto): Promise<Gig>;
  async remove(id: string, clientId: string): Promise<void>;
  private async validateOwner(id: string, clientId: string): Promise<Gig>;
}
```

### ProposalController

```typescript
class ProposalController {
  async send(req: Request, res: Response): Promise<void>;
  async getAll(req: Request, res: Response): Promise<void>;
  async getById(req: Request, res: Response): Promise<void>;
  async updateStatus(req: Request, res: Response): Promise<void>;
  async withdraw(req: Request, res: Response): Promise<void>;
}
```

### ProposalService

```typescript
class ProposalService {
  async create(
    freelancerId: string,
    gigId: string,
    data: CreateProposalDto,
  ): Promise<Proposal>;
  async findByUserId(userId: string, role: Role): Promise<Proposal[]>;
  async findById(id: string): Promise<Proposal>;
  async accept(id: string, clientId: string): Promise<Proposal>;
  async reject(id: string, clientId: string): Promise<Proposal>;
  async withdraw(id: string, freelancerId: string): Promise<Proposal>;
  private async validateNotDuplicate(
    gigId: string,
    freelancerId: string,
  ): Promise<void>;
  private async validateGigOpen(gigId: string): Promise<Gig>;
}
```

### ProfileService

```typescript
class ProfileService {
  async findByUserId(userId: string): Promise<Profile>;
  async update(userId: string, data: UpdateProfileDto): Promise<Profile>;
  async findPublicProfile(userId: string): Promise<PublicProfile>;
}
```

---

## Middleware

```typescript
class AuthMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): void;
}

class RoleMiddleware {
  requireRole(
    role: Role,
  ): (req: Request, res: Response, next: NextFunction) => void;
}

class ErrorMiddleware {
  handle(err: Error, req: Request, res: Response, next: NextFunction): void;
}

class ValidationMiddleware {
  validate(
    schema: ZodSchema,
  ): (req: Request, res: Response, next: NextFunction) => void;
}
```

---

## DTO (Data Transfer Objects)

```typescript
interface RegisterDto {
  email: string;
  password: string;
  role: Role;
}

interface LoginDto {
  email: string;
  password: string;
}

interface CreateGigDto {
  title: string;
  description: string;
  budget: number;
  categoryId: string;
  slots?: number;
  isOnsite?: boolean;
  location?: string;
  deadline?: Date;
}

interface UpdateGigDto extends Partial<CreateGigDto> {}

interface CreateProposalDto {
  coverLetter: string;
  bidAmount: number;
}

interface UpdateProfileDto {
  name?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  headline?: string;
  experienceLevel?: ExperienceLevel;
  company?: string;
  industry?: string;
  portfolioUrl?: string;
}
```

---

## Relasi Antar Kelas

| Kelas              | Bergantung Pada             | Tipe        |
| ------------------ | --------------------------- | ----------- |
| AuthController     | AuthService                 | Composition |
| GigController      | GigService                  | Composition |
| ProposalController | ProposalService, GigService | Composition |
| ProfileController  | ProfileService              | Composition |
| AuthService        | PrismaClient                | Dependency  |
| GigService         | PrismaClient                | Dependency  |
| ProposalService    | PrismaClient, GigService    | Dependency  |
| ProfileService     | PrismaClient                | Dependency  |
| Routes             | Controller, Middleware      | Association |
