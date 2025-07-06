// ❌ 의도적인 메모리 누수
class LeakyComponent {
    private handlers: (() => void)[] = [];
    private bigData = new Array(10000).fill('큰 데이터');
    
    constructor() {
      // 매번 새로운 클로저 생성
      setInterval(() => {
        const handler = () => {
          console.log(this.bigData.length);
        };
        this.handlers.push(handler);
        window.addEventListener('click', handler);
      }, 1000);
    }
  }
  
  // ✅ WeakMap과 FinalizationRegistry를 활용한 해결
  class SafeComponent {
    private listeners = new WeakMap<Element, Set<Function>>();
    private cleanupRegistry: FinalizationRegistry;
    
    constructor() {
      // GC 모니터링
      this.cleanupRegistry = new FinalizationRegistry((heldValue) => {
        console.log(`Cleaned up: ${heldValue}`);
      });
    }
    
    addEventListener(element: Element, event: string, handler: Function) {
      // WeakMap으로 요소와 핸들러 연결
      if (!this.listeners.has(element)) {
        this.listeners.set(element, new Set());
        
        // 요소가 GC될 때 추적
        this.cleanupRegistry.register(element, `${event} listener on ${element.tagName}`);
      }
      
      const wrappedHandler = (e: Event) => {
        try {
          handler(e);
        } catch (error) {
          console.error('Handler error:', error);
          this.removeEventListener(element, event, wrappedHandler);
        }
      };
      
      this.listeners.get(element)!.add(wrappedHandler);
      element.addEventListener(event, wrappedHandler);
      
      // 자동 정리를 위한 타임아웃
      setTimeout(() => {
        if (!document.body.contains(element)) {
          this.removeEventListener(element, event, wrappedHandler);
        }
      }, 60000); // 1분 후 DOM에서 제거된 요소 정리
    }
    
    removeEventListener(element: Element, event: string, handler: Function) {
      const handlers = this.listeners.get(element);
      if (handlers) {
        element.removeEventListener(event, handler as EventListener);
        handlers.delete(handler);
        
        if (handlers.size === 0) {
          this.listeners.delete(element);
        }
      }
    }
    
    destroy() {
      // WeakMap은 자동으로 GC되므로 수동 정리 불필요
      console.log('Component destroyed, WeakMap will handle cleanup');
    }
  }