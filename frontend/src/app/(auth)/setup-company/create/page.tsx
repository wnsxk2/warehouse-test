'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const createCompanySchema = z.object({
  name: z.string().min(2, '회사명은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  phone: z.string().optional(),
  address: z.string().optional(),
  maxUsers: z.number().min(1, '최소 1명 이상이어야 합니다').optional(),
});

type CreateCompanyFormData = z.infer<typeof createCompanySchema>;

export default function CreateCompanyPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      maxUsers: 50,
    },
  });

  const onSubmit = async (data: CreateCompanyFormData) => {
    setError('');
    setIsLoading(true);

    try {
      // Get access token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // If not logged in, redirect to login
        router.push('/login');
        return;
      }

      // Create company and assign user as admin
      await axios.post(`${API_URL}/companies/setup`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update user info in localStorage to reflect new companyId and role
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.role = 'ADMIN';
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || '회사 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">회사 생성</h1>
          <p className="mt-2 text-gray-600">
            회사 정보를 입력하시면 자동으로 관리자 권한이 부여됩니다
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">회사명 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="mt-1"
                  placeholder="주식회사 예시"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">회사 이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="mt-1"
                  placeholder="company@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  className="mt-1"
                  placeholder="02-1234-5678"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">주소</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  className="mt-1"
                  placeholder="서울특별시 강남구..."
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="maxUsers">최대 사용자 수</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  {...register('maxUsers', { valueAsNumber: true })}
                  className="mt-1"
                  defaultValue={50}
                />
                {errors.maxUsers && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxUsers.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  회사에 소속될 수 있는 최대 인원 수 (기본값: 50명)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                회사 생성하기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
