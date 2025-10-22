'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function JoinWithInvitePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Join with invite code
      await axios.post(
        `${API_URL}/companies/join-with-invite`,
        { code: inviteCode.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update user info in localStorage to reflect new company
      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.setItem('user', JSON.stringify(userResponse.data));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || '초대 코드 사용에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <KeyRound className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">초대코드 입력</h1>
          <p className="mt-2 text-gray-600">
            받으신 초대코드를 입력하여 회사에 참여하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>초대코드로 회사 참여</CardTitle>
            <CardDescription>
              관리자로부터 받은 8자리 초대코드를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">초대코드</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="예: ABCD1234"
                  required
                  maxLength={8}
                  className="font-mono text-lg text-center tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  초대코드는 대소문자를 구분하지 않습니다
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/setup-company')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  돌아가기
                </Button>
                <Button type="submit" disabled={isLoading || inviteCode.length < 8} className="flex-1">
                  {isLoading ? '참여 중...' : '회사 참여하기'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>초대코드는 회사 관리자가 생성합니다</p>
          <p className="mt-1">
            회사를 새로 만들고 싶으신가요?{' '}
            <button
              onClick={() => router.push('/setup-company/create')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              회사 생성하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
