import { useQuery, useMutation } from 'react-query';
import { createOrJoinSession, submitAnswer } from '../services/api';

export function useSession(sessionId, userId) {
  const joinSession = useMutation((data) => createOrJoinSession(data.sessionId, data.userId));

  const submitAnswerMutation = useMutation((data) => 
    submitAnswer(data.sessionId, data.userId, data.questionId, data.answer)
  );

  return {
    joinSession,
    submitAnswer: submitAnswerMutation,
  };
}

export default useSession;