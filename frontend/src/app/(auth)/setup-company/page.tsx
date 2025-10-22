'use client';

import { useRouter } from 'next/navigation';
import { Building2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetupCompanyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">환영합니다!</h1>
          <p className="mt-2 text-gray-600">
            회사를 생성하거나 초대코드를 입력하여 시작하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Company Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/setup-company/create')}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>회사 생성하기</CardTitle>
                  <CardDescription>새로운 회사를 만들고 관리자가 되세요</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  회사 정보 설정
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  관리자 권한 자동 부여
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  팀원 초대 및 관리
                </li>
              </ul>
              <Button className="w-full mt-4" onClick={() => router.push('/setup-company/create')}>
                회사 생성하기
              </Button>
            </CardContent>
          </Card>

          {/* Join with Invite Code Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/setup-company/join')}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <KeyRound className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>초대코드 입력하기</CardTitle>
                  <CardDescription>초대받은 회사에 참여하세요</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  초대코드로 간편 가입
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  기존 회사에 즉시 참여
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  팀원으로 업무 시작
                </li>
              </ul>
              <Button className="w-full mt-4" variant="outline" onClick={() => router.push('/setup-company/join')}>
                초대코드 입력하기
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500">
          이미 회사에 속해 있으신가요?{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
