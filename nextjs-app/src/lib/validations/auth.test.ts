import { describe, it } from 'node:test';
import assert from 'node:assert';
import { loginSchema } from './auth.ts';

describe('loginSchema', () => {
  it('should validate valid login credentials', () => {
    const validData = {
      username: 'testuser',
      password: 'password123',
    };
    const result = loginSchema.parse(validData);
    assert.deepStrictEqual(result, validData);
  });

  it('should throw error if username is empty', () => {
    const invalidData = {
      username: '',
      password: 'password123',
    };
    assert.throws(() => {
      loginSchema.parse(invalidData);
    }, (err: any) => {
      assert.strictEqual(err.issues[0].message, 'กรุณากรอกชื่อผู้ใช้');
      return true;
    });
  });

  it('should throw error if password is empty', () => {
    const invalidData = {
      username: 'testuser',
      password: '',
    };
    assert.throws(() => {
      loginSchema.parse(invalidData);
    }, (err: any) => {
        assert.strictEqual(err.issues[0].message, 'กรุณากรอกรหัสผ่าน');
        return true;
    });
  });

  it('should throw error if fields are missing', () => {
      const missingUsername = {
          password: 'password123'
      };
       assert.throws(() => {
        // @ts-expect-error testing missing field
        loginSchema.parse(missingUsername);
      });
  });
});
