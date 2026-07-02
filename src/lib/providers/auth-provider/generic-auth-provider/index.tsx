// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Alert, AlertDescription } from '@lib/client/components/ui/alert';
import { Button } from '@lib/client/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { Label } from '@lib/client/components/ui/label';
import {
  type AuthenticationContextProvider,
  type User,
} from '@lib/utils/access.types';
import config from '@lib/utils/config';
import { HasuraHeader, HasuraRole } from '@lib/utils/hasura.types';
import { useLogin, type AuthProvider } from '@refinedev/core';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';

/**
 * Configuration for the auth provider
 */
export interface GenericAuthProviderConfig {
  tokenKey?: string;
  userKey?: string;
}

/**
 * Default auth provider implementation
 */
const ADMIN_EMAIL = config.adminEmail;
const TENANT_ID = config.tenantId;

export const genericAdminUser: User = {
  id: '1',
  name: 'Admin User',
  email: ADMIN_EMAIL,
  roles: ['admin'],
};

/**
 * Custom Login Page Component using shadcn/ui
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: login, isPending: isLoading } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    login(
      { email, password },
      {
        onError: (error) => {
          setError(error?.message || 'Invalid email or password');
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#04091C] px-4 py-12 sm:px-6 lg:px-8">
      {/* brand glow backdrop */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, #06C8E8, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[-200px] right-[-120px] h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, #0EA5E9, transparent 70%)' }}
      />

      <Card className="relative w-full max-w-md border-white/10 bg-white shadow-2xl">
        <CardHeader className="items-center space-y-3 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-xl shadow-[0_0_24px_rgba(6,200,232,.45)]"
            style={{ background: 'linear-gradient(135deg, #06C8E8, #0EA5E9)' }}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="#04091C">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="mt-1">
              Sign in to the Zappo operator console
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full border-0 text-[#04091C] shadow-[0_0_20px_rgba(6,200,232,.35)] hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #06C8E8, #0EA5E9)' }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Creates a default permissive auth provider that uses localStorage
 * for persistence and always grants permissions
 */
export const createGenericAuthProvider = (
  config: GenericAuthProviderConfig = {},
): AuthProvider & AuthenticationContextProvider => {
  const { tokenKey = 'auth_token', userKey = 'auth_user' } = config;
  /**
   * Save token to storage
   */
  const saveToken = (token: string): void => {
    localStorage.setItem(tokenKey, token);
  };

  /**
   * Get token from storage
   */
  const getToken = async (): Promise<string | undefined> => {
    return localStorage.getItem(tokenKey) || undefined;
  };

  /**
   * Save user to storage
   */
  const saveUser = (user: User): void => {
    localStorage.setItem(userKey, JSON.stringify(user));
  };

  /**
   * Get user from storage
   */
  const getUser = (): User | null => {
    const userStr = localStorage.getItem(userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      return null;
    }
  };

  /**
   * Get permissions
   */
  const getPermissions = async () => {
    const user = getUser();
    return {
      roles: user?.roles || [],
    };
  };

  const getUserRole = async (): Promise<string | undefined> => {
    const roles = (await getPermissions()).roles;
    if (roles && roles.length > 0) {
      if (roles.includes(HasuraRole.ADMIN)) {
        return HasuraRole.ADMIN;
      }
      return HasuraRole.USER;
    }
    return undefined;
  };

  /**
   * Get the Hasura role from the identity
   */
  const getHasuraHeaders = async (): Promise<Map<HasuraHeader, string>> => {
    const hasuraHeaders = new Map<HasuraHeader, string>();

    const roles = (await getPermissions()).roles;
    if (roles && roles.length > 0 && roles.includes(HasuraRole.ADMIN)) {
      hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.ADMIN);
    } else {
      hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.USER);
    }

    hasuraHeaders.set(HasuraHeader.X_HASURA_TENANT_ID, TENANT_ID);

    return hasuraHeaders;
  };

  // Return the auth provider implementation
  return {
    login: async ({ email, password }) => {
      const result = await signIn('generic', {
        username: email,
        password,
        redirect: false,
      });

      if (!result || result.error || !result.ok) {
        return {
          success: false,
          error: {
            message: 'Login failed',
            name: 'Invalid email or password',
          },
        };
      }

      const session = await getSession();
      const su = (session?.user as any) ?? {};
      saveToken('tok_' + Math.random().toString(36).slice(2));
      saveUser({
        id: su.id ?? '1',
        name: su.name ?? 'Admin',
        email: su.email ?? email,
        roles: [su.role ?? 'admin'],
        role: su.role ?? 'admin',
        avatarColor: su.avatarColor ?? '#00C896',
      });

      window.location.href = '/overview';
      return {
        success: true,
        redirectTo: '/overview',
      };
    },

    logout: async () => {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);

      return {
        success: true,
        redirectTo: '/login',
      };
    },

    check: async () => {
      const token = await getToken();

      console.log('🔐 Auth check - token exists:', !!token);

      if (token) {
        return {
          authenticated: true,
        };
      }

      console.warn('❌ Not authenticated, should redirect to /login');
      return {
        authenticated: false,
        redirectTo: '/login',
        logout: true,
        error: {
          message: 'Not authenticated',
          name: 'Authentication Error',
        },
      };
    },

    onError: async (error) => {
      console.log(`Authprovider: onError triggered, error: ${error}`);
      // Only logout for auth errors, not schema validation errors
      if (error.statusCode === 401) {
        return {
          logout: true,
        };
      }

      // For other errors, just return an error without logging out
      return {
        error: {
          message: error.message,
          name: error.name,
        },
      };
    },

    getIdentity: async () => {
      const user = getUser();
      if (!user) return null;
      return user;
    },

    getPermissions,

    // AuthenticationContextProvider methods

    getToken,
    getUserRole,
    getHasuraHeaders,
    getInitialized: async (): Promise<boolean> => true,
    getLoginPage: () => LoginPage,
  };
};
