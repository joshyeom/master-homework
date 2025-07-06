// ❌ 의도적인 데드락
async function createDeadlock() {
    const state = {
      userReady: false,
      permissionReady: false
    };
    
    const waitForUser = async (): Promise<User> => {
      while (!state.permissionReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { id: '123', name: 'User' };
    };
    
    const waitForPermission = async (): Promise<Permission> => {
      while (!state.userReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { level: 'admin' };
    };
    
    // 서로를 영원히 기다림
    const [user, permission] = await Promise.all([
      waitForUser(),
      waitForPermission()
    ]);
  }
  
  // ✅ 타임아웃과 메시지 전달을 활용한 해결
  class DeadlockResolver {
    private messageQueue: Map<string, ((value: any) => void)[]> = new Map();
    
    // 타임아웃과 함께 대기
    async waitFor<T>(key: string, timeout: number = 5000): Promise<T> {
      return Promise.race([
        new Promise<T>((resolve) => {
          if (!this.messageQueue.has(key)) {
            this.messageQueue.set(key, []);
          }
          this.messageQueue.get(key)!.push(resolve);
        }),
        new Promise<T>((_, reject) => {
          setTimeout(() => {
            this.cleanup(key);
            reject(new Error(`Timeout waiting for ${key}`));
          }, timeout);
        })
      ]);
    }
    
    // 메시지 전달로 대기 해제
    notify(key: string, value: any) {
      const waiters = this.messageQueue.get(key);
      if (waiters) {
        waiters.forEach(resolve => resolve(value));
        this.messageQueue.delete(key);
      }
    }
    
    // 순환 의존성 감지
    async executeWithDeadlockDetection<T>(
      tasks: Array<() => Promise<T>>,
      maxWaitTime: number = 10000
    ): Promise<T[]> {
      const startTime = Date.now();
      const results: T[] = [];
      const completed = new Set<number>();
      
      const taskPromises = tasks.map(async (task, index) => {
        try {
          const result = await task();
          completed.add(index);
          
          // 다른 태스크에게 완료 신호
          this.notify(`task-${index}-complete`, result);
          
          return result;
        } catch (error) {
          // 데드락 감지
          if (Date.now() - startTime > maxWaitTime) {
            throw new Error(`Possible deadlock detected in task ${index}`);
          }
          throw error;
        }
      });
      
      return Promise.all(taskPromises);
    }
    
    private cleanup(key: string) {
      this.messageQueue.delete(key);
    }
  }
  
  // 사용 예시
  const resolver = new DeadlockResolver();
  
  async function safeAsyncOperation() {
    try {
      // 타임아웃과 함께 대기
      const userData = await resolver.waitFor<User>('user-data', 3000);
      
      // 다른 곳에서 데이터 준비되면 notify
      setTimeout(() => {
        resolver.notify('user-data', { id: '123', name: 'User' });
      }, 1000);
      
    } catch (error) {
      console.error('Operation failed:', error);
      // 타임아웃이나 데드락 처리
    }
  }