'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Loader2, Users, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  maxUsers: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [isMaxUsersDialogOpen, setIsMaxUsersDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [maxUsers, setMaxUsers] = useState('50');
  const [userForm, setUserForm] = useState({
    userId: '',
    role: 'USER',
  });
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    maxUsers: 50,
  });

  // Fetch company
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', resolvedParams.id],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<Company>(
        `${API_URL}/companies/${resolvedParams.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
  });

  // Fetch company users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['company-users', resolvedParams.id],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<User[]>(
        `${API_URL}/companies/${resolvedParams.id}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
  });

  // Fetch unassigned users
  const { data: unassignedUsers } = useQuery({
    queryKey: ['unassigned-users'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<User[]>(
        `${API_URL}/users/admin/unassigned`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    enabled: isAddUserDialogOpen,
  });

  // Update company info
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyForm) => {
      const token = localStorage.getItem('accessToken');
      return axios.patch(`${API_URL}/companies/${resolvedParams.id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company', resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setIsEditCompanyDialogOpen(false);
      toast({ title: '회사 정보가 성공적으로 수정되었습니다.' });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '회사 정보 수정에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // Update max users
  const updateMaxUsersMutation = useMutation({
    mutationFn: async (newMaxUsers: number) => {
      const token = localStorage.getItem('accessToken');
      return axios.patch(
        `${API_URL}/companies/${resolvedParams.id}`,
        { maxUsers: newMaxUsers },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company', resolvedParams.id],
      });
      setIsMaxUsersDialogOpen(false);
      toast({ title: '최대 인원이 성공적으로 변경되었습니다.' });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '최대 인원 변경에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // Add user (assign existing user to company)
  const addUserMutation = useMutation({
    mutationFn: async (userData: typeof userForm) => {
      const token = localStorage.getItem('accessToken');
      return axios.patch(
        `${API_URL}/users/admin/${userData.userId}/assign-company`,
        {
          companyId: resolvedParams.id,
          role: userData.role,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-users', resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ['unassigned-users'] });
      setIsAddUserDialogOpen(false);
      setUserForm({ userId: '', role: 'USER' });
      toast({ title: '사용자가 성공적으로 추가되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message =
        error.response?.data?.message || '사용자 추가에 실패했습니다.';
      toast({ title: '오류', description: message, variant: 'destructive' });
    },
  });

  // Change role
  const changeRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const token = localStorage.getItem('accessToken');
      return axios.patch(
        `${API_URL}/users/admin/${data.userId}/role`,
        { role: data.role },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-users', resolvedParams.id],
      });
      setIsChangeRoleDialogOpen(false);
      setSelectedUser(null);
      toast({ title: '권한이 성공적으로 변경되었습니다.' });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '권한 변경에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // Remove user from company
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('accessToken');
      return axios.delete(`${API_URL}/users/admin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-users', resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ['unassigned-users'] });
      setIsDeleteUserDialogOpen(false);
      setSelectedUser(null);
      toast({ title: '회사에서 사용자가 성공적으로 제거되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '사용자 제거에 실패했습니다.';
      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const handleEditCompany = () => {
    if (company) {
      setCompanyForm({
        name: company.name,
        email: company.email,
        phone: company.phone || '',
        address: company.address || '',
        maxUsers: company.maxUsers,
      });
      setIsEditCompanyDialogOpen(true);
    }
  };

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate(companyForm);
  };

  const handleUpdateMaxUsers = () => {
    const num = parseInt(maxUsers);
    if (num > 0) {
      updateMaxUsersMutation.mutate(num);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.userId) {
      toast({
        title: '오류',
        description: '사용자를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }
    addUserMutation.mutate(userForm);
  };

  const handleChangeRole = (role: string) => {
    if (selectedUser) {
      changeRoleMutation.mutate({ userId: selectedUser.id, role });
    }
  };

  if (companyLoading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!company) {
    return <div>회사를 찾을 수 없습니다.</div>;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <Button variant='ghost' onClick={() => router.back()} className='mb-4'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          돌아가기
        </Button>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>{company.name}</h1>
            <p className='text-muted-foreground'>{company.email}</p>
          </div>
          <Button
            onClick={() => {
              setMaxUsers(company.maxUsers.toString());
              setIsMaxUsersDialogOpen(true);
            }}
          >
            <Edit className='mr-2 h-4 w-4' />
            최대 인원 설정
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle>회사 정보</CardTitle>
            <Button size='sm' variant='outline' onClick={handleEditCompany}>
              <Edit className='mr-2 h-4 w-4' />
              수정
            </Button>
          </CardHeader>
          <CardContent className='space-y-2'>
            <div>
              <span className='font-medium'>이메일:</span> {company.email}
            </div>
            <div>
              <span className='font-medium'>전화번호:</span>{' '}
              {company.phone || '-'}
            </div>
            <div>
              <span className='font-medium'>주소:</span>{' '}
              {company.address || '-'}
            </div>
            <div>
              <span className='font-medium'>등록일:</span>{' '}
              {new Date(company.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용자 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Users className='h-8 w-8 text-blue-600' />
                <div>
                  <div className='text-2xl font-bold'>
                    {users?.length || 0} / {company.maxUsers}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    현재 / 최대 인원
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>사용자 관리</CardTitle>
              <CardDescription>회사 소속 사용자 목록</CardDescription>
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              사용자 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className='flex items-center justify-center p-12'>
              <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setSelectedUser(user);
                            setIsChangeRoleDialogOpen(true);
                          }}
                        >
                          {user.role}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.isActive ? '활성' : '비활성'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteUserDialogOpen(true);
                          }}
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center py-12 text-gray-500'
                    >
                      등록된 사용자가 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Info Dialog */}
      <Dialog
        open={isEditCompanyDialogOpen}
        onOpenChange={setIsEditCompanyDialogOpen}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>회사 정보 수정</DialogTitle>
            <DialogDescription>회사의 기본 정보를 수정합니다</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCompany}>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-name'>회사명 *</Label>
                <Input
                  id='edit-name'
                  value={companyForm.name}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-email'>이메일 *</Label>
                <Input
                  id='edit-email'
                  type='email'
                  value={companyForm.email}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-phone'>전화번호</Label>
                <Input
                  id='edit-phone'
                  value={companyForm.phone}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, phone: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-address'>주소</Label>
                <Textarea
                  id='edit-address'
                  value={companyForm.address}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, address: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-maxUsers'>최대 사용자 수 *</Label>
                <Input
                  id='edit-maxUsers'
                  type='number'
                  min='1'
                  value={companyForm.maxUsers}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      maxUsers: parseInt(e.target.value) || 50,
                    })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditCompanyDialogOpen(false)}
              >
                취소
              </Button>
              <Button type='submit' disabled={updateCompanyMutation.isPending}>
                {updateCompanyMutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Max Users Dialog */}
      <Dialog
        open={isMaxUsersDialogOpen}
        onOpenChange={setIsMaxUsersDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최대 인원 설정</DialogTitle>
            <DialogDescription>
              회사의 최대 사용자 수를 설정합니다
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Label htmlFor='maxUsers'>최대 인원</Label>
            <Input
              id='maxUsers'
              type='number'
              min='1'
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              className='mt-2'
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsMaxUsersDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleUpdateMaxUsers}
              disabled={updateMaxUsersMutation.isPending}
            >
              {updateMaxUsersMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 추가</DialogTitle>
            <DialogDescription>
              기존 회원을 이 회사에 추가합니다
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className='space-y-4 py-4'>
              <div>
                <Label htmlFor='user-select'>사용자 선택 *</Label>
                <Select
                  value={userForm.userId}
                  onValueChange={(value) =>
                    setUserForm({ ...userForm, userId: value })
                  }
                >
                  <SelectTrigger id='user-select'>
                    <SelectValue placeholder='사용자를 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedUsers && unassignedUsers.length > 0 ? (
                      unassignedUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value='no-users' disabled>
                        할당 가능한 사용자가 없습니다
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='role'>권한</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) =>
                    setUserForm({ ...userForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='USER'>USER</SelectItem>
                    <SelectItem value='MANAGER'>MANAGER</SelectItem>
                    <SelectItem value='ADMIN'>ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddUserDialogOpen(false)}
              >
                취소
              </Button>
              <Button type='submit' disabled={addUserMutation.isPending}>
                {addUserMutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                추가
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog
        open={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>권한 변경</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}님의 권한을 변경합니다
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Label>권한 선택</Label>
            <div className='flex gap-2 mt-2'>
              <Button
                variant={selectedUser?.role === 'USER' ? 'default' : 'outline'}
                onClick={() => handleChangeRole('USER')}
              >
                USER
              </Button>
              <Button
                variant={
                  selectedUser?.role === 'MANAGER' ? 'default' : 'outline'
                }
                onClick={() => handleChangeRole('MANAGER')}
              >
                MANAGER
              </Button>
              <Button
                variant={selectedUser?.role === 'ADMIN' ? 'default' : 'outline'}
                onClick={() => handleChangeRole('ADMIN')}
              >
                ADMIN
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsChangeRoleDialogOpen(false)}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User from Company Dialog */}
      <AlertDialog
        open={isDeleteUserDialogOpen}
        onOpenChange={setIsDeleteUserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회사에서 사용자 제거</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &quot;{selectedUser?.name}&quot; 사용자를 이 회사에서 제거하시겠습니까?
              <br />사용자 계정은 삭제되지 않으며, 회사 소속만 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedUser && deleteUserMutation.mutate(selectedUser.id)
              }
              disabled={deleteUserMutation.isPending}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleteUserMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              제거
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
