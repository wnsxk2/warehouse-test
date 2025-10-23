'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building2, Settings as SettingsIcon } from 'lucide-react';
import { ProfileSettings } from '@/components/features/settings/profile-settings';
import { CompanySettings } from '@/components/features/settings/company-settings';
import { PreferencesSettings } from '@/components/features/settings/preferences-settings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Header */}
      <div className="space-y-[var(--space-2)]">
        <h1 className="title-l text-gray-900">설정</h1>
        <p className="body-s text-gray-700">계정 설정 및 환경설정을 관리하세요</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-[var(--space-6)]">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-gray-200 p-1 rounded-[var(--radius-md)]">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 body-m data-[state=active]:bg-gray-100 data-[state=active]:text-[var(--primary-default)] rounded-[var(--radius-sm)]"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">프로필</span>
          </TabsTrigger>
          <TabsTrigger
            value="company"
            className="flex items-center gap-2 body-m data-[state=active]:bg-gray-100 data-[state=active]:text-[var(--primary-default)] rounded-[var(--radius-sm)]"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">회사</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-2 body-m data-[state=active]:bg-gray-100 data-[state=active]:text-[var(--primary-default)] rounded-[var(--radius-sm)]"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">환경설정</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-[var(--space-6)]">
          <Card className="border-gray-400 bg-gray-100 shadow-sm rounded-[var(--radius-md)]">
            <CardHeader>
              <CardTitle className="title-m text-gray-900">프로필 설정</CardTitle>
              <CardDescription className="body-s text-gray-700">
                개인 정보 및 비밀번호를 업데이트하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-[var(--space-6)]">
          <Card className="border-gray-400 bg-gray-100 shadow-sm rounded-[var(--radius-md)]">
            <CardHeader>
              <CardTitle className="title-m text-gray-900">회사 설정</CardTitle>
              <CardDescription className="body-s text-gray-700">
                회사 정보를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-[var(--space-6)]">
          <Card className="border-gray-400 bg-gray-100 shadow-sm rounded-[var(--radius-md)]">
            <CardHeader>
              <CardTitle className="title-m text-gray-900">환경설정</CardTitle>
              <CardDescription className="body-s text-gray-700">
                애플리케이션 사용 환경을 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
