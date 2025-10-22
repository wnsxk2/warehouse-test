'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Copy, Check, XCircle, Ticket } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  maxUsers: number;
  isActive: boolean;
  users: User[];
  _count: {
    warehouses: number;
    items: number;
    users: number;
  };
}

interface AddUserFormData {
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface InviteCode {
  id: string;
  code: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
}

export default function ManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<AddUserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'USER',
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch company info
  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ['my-company'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/companies/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch company users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['my-company-users'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/companies/my/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch invite codes
  const { data: inviteCodes, isLoading: inviteCodesLoading } = useQuery<InviteCode[]>({
    queryKey: ['my-invite-codes'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/companies/my/invite-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: AddUserFormData) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(`${API_URL}/companies/my/users`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company-users'] });
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      setIsAddUserDialogOpen(false);
      setFormData({ email: '', password: '', name: '', role: 'USER' });
      toast({ title: '사용자가 성공적으로 추가되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '사용자 추가에 실패했습니다.';
      toast({ title: '오류', description: message, variant: 'destructive' });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const token = localStorage.getItem('accessToken');
      return axios.patch(
        `${API_URL}/users/company-admin/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company-users'] });
      toast({ title: '권한이 성공적으로 변경되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '권한 변경에 실패했습니다.';
      toast({ title: '오류', description: message, variant: 'destructive' });
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('accessToken');
      return axios.delete(`${API_URL}/users/company-admin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company-users'] });
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      setIsDeleteUserDialogOpen(false);
      setSelectedUser(null);
      toast({ title: '회사에서 사용자가 성공적으로 제거되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '사용자 제거에 실패했습니다.';
      toast({ title: '오류', description: message, variant: 'destructive' });
    },
  });

  // Create invite code mutation
  const createInviteCodeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken');
      return axios.post(
        `${API_URL}/companies/my/invite-codes`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invite-codes'] });
      toast({ title: '초대 코드가 생성되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '초대 코드 생성에 실패했습니다.';
      toast({ title: '오류', description: message, variant: 'destructive' });
    },
  });

  // Deactivate invite code mutation
  const deactivateInviteCodeMutation = useMutation({
    mutationFn: async (inviteCodeId: string) => {
      const token = localStorage.getItem('accessToken');
      return axios.patch(
        `${API_URL}/companies/my/invite-codes/${inviteCodeId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invite-codes'] });
      toast({ title: '초대 코드가 비활성화되었습니다.' });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || '초대 코드 비활성화에 실패했습니다.';
      toast({ title: '오류', description: message, variant: 'destructive' });
    },
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUserMutation.mutate(formData);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleRemoveUser = () => {
    if (selectedUser) {
      removeUserMutation.mutate(selectedUser.id);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({ title: '초대 코드가 복사되었습니다.' });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({ title: '오류', description: '복사에 실패했습니다.', variant: 'destructive' });
    }
  };

  const handleCreateInviteCode = () => {
    createInviteCodeMutation.mutate();
  };

  const handleDeactivateInviteCode = (inviteCodeId: string) => {
    deactivateInviteCodeMutation.mutate(inviteCodeId);
  };

  if (companyLoading || usersLoading || inviteCodesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">사용자 관리</h1>
        <p className="mt-2 text-gray-600">회사 소속 사용자를 관리합니다</p>
      </div>

      {/* Company Info Card */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle>회사 정보</CardTitle>
            <CardDescription>현재 회사의 기본 정보입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">회사명</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">이메일</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.phone || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">주소</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.address || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">최대 사용자 수</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company._count.users} / {company.maxUsers}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">창고 수</dt>
                <dd className="mt-1 text-sm text-gray-900">{company._count.warehouses}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>소속 사용자</CardTitle>
            <CardDescription>
              회사에 소속된 사용자를 관리합니다 ({users?.length || 0}명)
            </CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                사용자 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddUser}>
                <DialogHeader>
                  <DialogTitle>사용자 추가</DialogTitle>
                  <DialogDescription>
                    새로운 사용자를 회사에 추가합니다
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">권한</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'USER' | 'ADMIN') =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddUserDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={addUserMutation.isPending}>
                    {addUserMutation.isPending ? '추가 중...' : '추가'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteUserDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    소속된 사용자가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Codes Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>초대 코드</CardTitle>
            <CardDescription>
              회사에 새로운 사용자를 초대하기 위한 코드를 생성하고 관리합니다
            </CardDescription>
          </div>
          <Button onClick={handleCreateInviteCode} disabled={createInviteCodeMutation.isPending}>
            <Ticket className="mr-2 h-4 w-4" />
            {createInviteCodeMutation.isPending ? '생성 중...' : '초대 코드 생성'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>코드</TableHead>
                <TableHead>생성자</TableHead>
                <TableHead>사용 횟수</TableHead>
                <TableHead>만료일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes && inviteCodes.length > 0 ? (
                inviteCodes.map((inviteCode) => {
                  const isExpired = new Date(inviteCode.expiresAt) < new Date();
                  const isFull = inviteCode.usedCount >= inviteCode.maxUses;
                  return (
                    <TableRow key={inviteCode.id}>
                      <TableCell className="font-mono font-bold">
                        <div className="flex items-center gap-2">
                          <span>{inviteCode.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(inviteCode.code)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedCode === inviteCode.code ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{inviteCode.creator.name}</div>
                          <div className="text-xs text-gray-500">{inviteCode.creator.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={isFull ? 'text-red-600 font-medium' : ''}>
                          {inviteCode.usedCount} / {inviteCode.maxUses}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{new Date(inviteCode.expiresAt).toLocaleDateString('ko-KR')}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(inviteCode.expiresAt).toLocaleTimeString('ko-KR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!inviteCode.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            비활성
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            만료됨
                          </span>
                        ) : isFull ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            사용 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            활성
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {inviteCode.isActive && !isExpired && !isFull && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateInviteCode(inviteCode.id)}
                            disabled={deactivateInviteCodeMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 text-orange-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    생성된 초대 코드가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회사에서 사용자 제거</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &quot;{selectedUser?.name}&quot; 사용자를 이 회사에서 제거하시겠습니까?
              <br />
              사용자 계정은 삭제되지 않으며, 회사 소속만 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeUserMutation.isPending}
            >
              {removeUserMutation.isPending ? '제거 중...' : '제거'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
