// ❌ 의도적인 데드락 (순환 참조)
async function createSimpleDeadlock() {
  let aData: string;
  let bData: string;
  
  // A는 B를 기다림
  const promiseA = new Promise<string>(async (resolve) => {
    const b = await promiseB;  // B 기다림
    resolve(`A complete with ${b}`);
  });
  
  // B는 A를 기다림  
  const promiseB = new Promise<string>(async (resolve) => {
    const a = await promiseA;  // A 기다림
    resolve(`B complete with ${a}`);
  });
  
  // 영원히 끝나지 않음
  const result = await Promise.all([promiseA, promiseB]);
  console.log(result); // 절대 실행 안됨
}

// ✅ 해결된 코드
async function fixedAsyncFlow() {
  // 방법 1: 순차적 실행
  const aData = await fetchA();
  const bData = await fetchB(aData); // A 결과를 B에 전달
  
  // 방법 2: 독립적으로 실행
  const [aResult, bResult] = await Promise.all([
    fetchA(),  // 서로 의존하지 않음
    fetchB()   // 독립적으로 실행 가능
  ]);
  
  return { aResult, bResult };
}