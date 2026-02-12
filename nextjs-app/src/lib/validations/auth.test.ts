import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { changePasswordSchema } from './auth.ts';

describe('changePasswordSchema', () => {
    it('should validate valid password change request', () => {
        const input = {
            current_password: 'oldpassword',
            new_password: 'newpassword123',
            confirm_password: 'newpassword123',
        };
        const result = changePasswordSchema.safeParse(input);
        assert.strictEqual(result.success, true);
        if (result.success) {
            assert.deepStrictEqual(result.data, input);
        }
    });

    it('should fail if new_password is too short', () => {
        const input = {
            current_password: 'oldpassword',
            new_password: '12345',
            confirm_password: '12345',
        };
        const result = changePasswordSchema.safeParse(input);
        assert.strictEqual(result.success, false);
        if (!result.success) {
            const issues = result.error.issues;
            assert.ok(issues.some((issue: any) => issue.message.includes('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')));
        }
    });

    it('should fail if confirm_password does not match new_password', () => {
        const input = {
            current_password: 'oldpassword',
            new_password: 'newpassword123',
            confirm_password: 'mismatchpassword',
        };
        const result = changePasswordSchema.safeParse(input);
        assert.strictEqual(result.success, false);
        if (!result.success) {
            const issues = result.error.issues;
            const mismatchIssue = issues.find((issue: any) => issue.message === 'รหัสผ่านไม่ตรงกัน');
            assert.ok(mismatchIssue, 'Should have mismatch error');
            assert.deepStrictEqual(mismatchIssue.path, ['confirm_password']);
        }
    });

    it('should fail if required fields are missing', () => {
        const input = {
            current_password: '',
            new_password: '',
            confirm_password: '',
        };
        const result = changePasswordSchema.safeParse(input);
        assert.strictEqual(result.success, false);
        if (!result.success) {
            const issues = result.error.issues;
            assert.ok(issues.some((issue: any) => issue.message === 'กรุณากรอกรหัสผ่านปัจจุบัน'));
            assert.ok(issues.some((issue: any) => issue.message === 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'));
            assert.ok(issues.some((issue: any) => issue.message === 'กรุณายืนยันรหัสผ่าน'));
        }
    });
});
