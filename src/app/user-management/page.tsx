'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown,
  Filter,
  Key
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { userService } from '@/services/user-service';
import { User, CreateUserRequest, UpdateUserRequest, UserFilters } from '@/types';
import { UserForm } from '@/components/forms/user-form';

export default function UserManagementPage() {
  const { hasPermission, isInitialized } = useRoleProtection();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch users
  const { data: allUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: hasPermission,
  });

  // Fetch online users
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: () => userService.getOnlineUsers(),
    enabled: hasPermission,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter and paginate users
  const filters: UserFilters = {
    search: searchTerm,
    role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    page: currentPage,
    limit: pageSize
  };

  const filteredResult = userService.filterUsers(allUsers, filters);
  const users = filteredResult.data;
  const totalUsers = filteredResult.total;
  const totalPages = filteredResult.totalPages;

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı başarıyla eklendi');
      setIsFormOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kullanıcı eklenirken bir hata oluştu');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: userService.updateUser,
    onMutate: async (updateData: UpdateUserRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['users']);
      
      // Optimistically update user data (without status change)
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        if (!old) return [];
        return old.map(user => 
          user.id === updateData.id 
            ? { 
                ...user, 
                username: updateData.username,
                email: updateData.email,
                role: updateData.role
                // isActive will be handled separately if changed
              } 
            : user
        );
      });
      
      console.log('Optimistic update for user data:', updateData);
      
      // Return context with snapshot
      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      toast.error('Kullanıcı güncellenirken bir hata oluştu');
    },
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla güncellendi');
      setIsFormOpen(false);
      setEditingUser(null);
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı başarıyla silindi');
      setIsDeleteOpen(false);
      setDeleteUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isLocked }: { id: string, isLocked: boolean }) => 
      userService.toggleUserStatus(id, isLocked),
    onMutate: async ({ id, isLocked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['users']);
      
      // Optimistically update to new value
      // isLocked = true means user is locked (inactive)
      // isActive should be the opposite of isLocked
      // Also set lockoutEnd field according to backend format
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        if (!old) return [];
        return old.map(user => 
          user.id === id 
            ? { 
                ...user, 
                isActive: !isLocked,
                lockoutEnd: isLocked ? '9999-12-31T23:59:59.9999999+00:00' : null
              } 
            : user
        );
      });
      
      console.log('Optimistic update:', { id, isLocked, newIsActive: !isLocked });
      
      // Return context with snapshot
      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      toast.error('Kullanıcı durumu güncellenirken bir hata oluştu');
    },
    onSuccess: () => {
      toast.success('Kullanıcı durumu güncellendi');
    },
    onSettled: () => {
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string, password: string }) => 
      userService.changeUserPassword(id, password),
    onSuccess: () => {
      toast.success('Şifre başarıyla değiştirildi');
      setIsPasswordOpen(false);
      setPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Şifre değiştirirken bir hata oluştu');
    }
  });

  if (!isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Yükleniyor...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPermission) {
    return null;
  }

  const handleFormSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    try {
      if (editingUser) {
        const updateData = data as UpdateUserRequest;
        
        // İlk önce kullanıcı bilgilerini güncelle
        await updateUserMutation.mutateAsync(updateData);
        
        // Eğer isActive değişmişse, ayrı bir toggle status çağrısı yap
        const originalIsActive = editingUser.isActive !== false;
        const newIsActive = updateData.isActive !== false;
        
        if (originalIsActive !== newIsActive) {
          console.log('isActive changed, calling toggle status:', {
            original: originalIsActive,
            new: newIsActive,
            shouldLock: newIsActive ? false : true // Aktif yapacaksa false (unlock), pasif yapacaksa true (lock)
          });
          
          await toggleStatusMutation.mutateAsync({
            id: updateData.id,
            isLocked: !newIsActive // isActive false ise lock et (true), true ise unlock et (false)
          });
        }
      } else {
        await createUserMutation.mutateAsync(data as CreateUserRequest);
      }
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    
    try {
      await deleteUserMutation.mutateAsync(deleteUser.id);
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      // Backend API: true = locked (pasif), false = unlocked (aktif)
      // Frontend: isActive = true (aktif), isActive = false (pasif)
      const currentlyActive = user.isActive !== false; // undefined ya da true ise aktif
      const shouldLock = currentlyActive; // Aktifse lock et (pasif yap)
      
      console.log('Toggling user status:', {
        userId: user.id,
        username: user.username,
        currentlyActive,
        shouldLock,
        currentIsActive: user.isActive
      });
      
      await toggleStatusMutation.mutateAsync({ 
        id: user.id, 
        isLocked: shouldLock 
      });
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeleteUser(user);
    setIsDeleteOpen(true);
  };

  const openPasswordDialog = (user: User) => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordOpen(true);
  };

  const handlePasswordChange = async () => {
    if (!passwordUser) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({ 
        id: passwordUser.id, 
        password: newPassword 
      });
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'User': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Crown className="h-3 w-3" />;
      case 'User': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  // Statistics
  const totalUsersCount = allUsers.length;
  const activeUsersCount = allUsers.filter(user => user.isActive !== false).length;
  const onlineUsersCount = onlineUsers.length;
  const adminUsersCount = allUsers.filter(user => user.role === 'Admin').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
            <p className="text-muted-foreground">
              Sistem kullanıcılarını yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsersCount}</div>
            </CardContent>
          </Card>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Kullanıcı
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({onlineUsersCount} çevrimiçi)
                      </span>
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeUsersCount}</div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div>
                  <p className="font-semibold mb-2">Çevrimiçi Kullanıcılar ({onlineUsersCount})</p>
                  {onlineUsers.length > 0 ? (
                    <div className="space-y-1">
                      {onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {user.username}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Çevrimiçi kullanıcı yok</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Kullanıcı</CardTitle>
              <Crown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsersCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcılar</CardTitle>
            <CardDescription>
              Toplam {totalUsers} kullanıcı görüntüleniyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Kullanıcılar yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit`}
                            >
                              {getRoleIcon(user.role)}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive !== false ? "default" : "secondary"}>
                              {user.isActive !== false ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditForm(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                  {user.isActive !== false ? (
                                    <UserX className="mr-2 h-4 w-4" />
                                  ) : (
                                    <UserCheck className="mr-2 h-4 w-4" />
                                  )}
                                  {user.isActive !== false ? 'Pasif Yap' : 'Aktif Yap'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Şifre Değiştir
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(user)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Sayfa {currentPage} / {totalPages} (Toplam {totalUsers} kayıt)
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Önceki
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Sonraki
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kullanıcı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. {deleteUser?.username} adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 
                  'Mevcut kullanıcı bilgilerini düzenleyin' :
                  'Yeni kullanıcı bilgilerini girin'
                }
              </DialogDescription>
            </DialogHeader>
            <UserForm
              user={editingUser || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingUser(null);
              }}
              isLoading={
                createUserMutation.isPending || 
                updateUserMutation.isPending
              }
            />
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Şifre Değiştir</DialogTitle>
              <DialogDescription>
                {passwordUser?.username} kullanıcısı için yeni şifre belirleyin
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  Yeni Şifre
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Yeni şifre"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-password" className="text-right">
                  Şifre Tekrar
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Şifre tekrar"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
                İptal
              </Button>
              <Button
                type="submit"
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              >
                {changePasswordMutation.isPending ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}