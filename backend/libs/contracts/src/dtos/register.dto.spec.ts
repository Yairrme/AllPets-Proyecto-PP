import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { RegisterDto } from './register.dto';

const base = {
  name: 'Ana',
  email: 'ana@test.com',
  password: 'secreto123',
  city: 'Neuquén',
};

const phoneErrors = (body: object) =>
  validateSync(plainToInstance(RegisterDto, { ...base, ...body })).filter(
    (error) => error.property === 'phone',
  );

describe('RegisterDto.phone', () => {
  it.each([undefined, null, ''])(
    'un cliente puede registrarse sin teléfono (%s)',
    (phone) => {
      expect(phoneErrors({ role: UserRole.CLIENT, phone })).toHaveLength(0);
    },
  );

  it.each([{ a: 1 }, 123, 'x'.repeat(31)])(
    'si un cliente lo manda, se valida (%s)',
    (phone) => {
      expect(phoneErrors({ role: UserRole.CLIENT, phone })).toHaveLength(1);
    },
  );

  it('un prestador debe informarlo', () => {
    expect(phoneErrors({ role: UserRole.WALKER })).toHaveLength(1);
    expect(phoneErrors({ role: UserRole.WALKER, phone: '' })).toHaveLength(1);
    expect(
      phoneErrors({ role: UserRole.WALKER, phone: '2991234567' }),
    ).toHaveLength(0);
  });
});
