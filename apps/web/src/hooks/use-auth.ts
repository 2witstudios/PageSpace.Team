import useSWR from 'swr';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  return res.json();
});

export function useAuth() {
  const { data: user, error, isLoading } = useSWR<User>('/api/auth/me', fetcher);

  return {
    user,
    isLoading,
    isError: error,
    isAuthenticated: !error && !isLoading && !!user,
  };
}