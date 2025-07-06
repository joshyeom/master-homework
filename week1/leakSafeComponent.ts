// ❌ 의도적인 메모리 누수
const LeakyComponent = () => {
  const [count, setCount] = useState(0);
  const bigData = new Array(10000).fill('메모리 차지하는 데이터');
  
  useEffect(() => {
    const handleClick = () => {
      console.log(`클릭! count: ${count}, 데이터 크기: ${bigData.length}`);
      setCount(prev => prev + 1);
    };
    
    // 리스너만 추가하고 제거 안함
    window.addEventListener('click', handleClick);
    // cleanup 없음!
  }); // deps 배열도 없어서 매 렌더링마다 새 리스너 추가
  
  return <div>Count: {count}</div>;
};

// ✅ 해결된 코드
const FixedComponent = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const handleClick = () => {
      setCount(prev => prev + 1);
    };
    
    window.addEventListener('click', handleClick);
    
    // cleanup 함수 추가
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []); // deps 배열 추가해서 한 번만 실행
  
  return <div>Count: {count}</div>;
};