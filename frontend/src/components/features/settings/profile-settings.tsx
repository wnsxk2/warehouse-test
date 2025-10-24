'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';

const profileSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').max(100),
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  newPassword: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfileSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getMe,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        name: currentUser.name,
        email: currentUser.email,
      });
    }
  }, [currentUser, profileForm]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: '성공',
        description: '프로필이 업데이트되었습니다',
      });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '프로필 업데이트에 실패했습니다',
        variant: 'destructive',
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast({
        title: '성공',
        description: '비밀번호가 변경되었습니다',
      });
      passwordForm.reset();
    },
    onError: (error: unknown) => {
      const errorResponse = error as { response?: { data?: { message?: string } } };
      const message = errorResponse?.response?.data?.message || '비밀번호 변경에 실패했습니다';
      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    // Only send name, email is read-only
    updateProfileMutation.mutate({ name: data.name });
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">프로필 정보</h3>
          <p className="text-sm text-muted-foreground">
            개인 정보를 업데이트하세요
          </p>
        </div>

        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input placeholder="이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="이메일을 입력하세요" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    이메일은 계정과 연결되어 있으며 변경할 수 없습니다
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                변경사항 저장
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <Separator />

      {/* Change Password */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">비밀번호 변경</h3>
          <p className="text-sm text-muted-foreground">
            계정 보안을 위해 비밀번호를 업데이트하세요
          </p>
        </div>

        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>현재 비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="현재 비밀번호를 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>새 비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="새 비밀번호를 입력하세요" {...field} />
                  </FormControl>
                  <FormDescription>
                    비밀번호는 최소 6자 이상이어야 합니다
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>새 비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="새 비밀번호를 다시 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                비밀번호 업데이트
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
