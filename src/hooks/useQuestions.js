import { useQuery } from 'react-query';
import { fetchQuestions } from '../services/api';

export function useQuestions() {
  return useQuery('questions', fetchQuestions, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

export default useQuestions;