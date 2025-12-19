// Node test harness to validate sorting functions

let sortField = 'nama';
let sortDescending = false;

function valueForField(obj) {
  const v = sortField === 'ipk' ? Number(obj.ipk) : String(obj[sortField]).toLowerCase();
  return v;
}
function compareForSort(a,b){
  const av = valueForField(a);
  const bv = valueForField(b);
  if (av === bv) return 0;
  if (typeof av === 'number') return av - bv;
  return av.localeCompare(bv);
}
function shouldSwap(a,b){
  const cmp = compareForSort(a,b);
  return cmp > 0;
}
function bubbleSort(arr){
  const n = arr.length;
  for(let i=0;i<n-1;i++){
    for(let j=0;j<n-i-1;j++){
      if(shouldSwap(arr[j], arr[j+1])){
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
    }
  }
  return arr;
}
function insertionSort(arr){
  for(let i=1;i<arr.length;i++){
    const key = arr[i];
    let j = i-1;
    while(j>=0){
      if(!shouldSwap(arr[j], key)) break;
      arr[j+1] = arr[j];
      j--;
    }
    arr[j+1] = key;
  }
  return arr;
}
function mergeSort(arr){
  if(arr.length<=1) return arr;
  const mid = Math.floor(arr.length/2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
function merge(left,right){
  const result = [];
  let i=0,j=0;
  while(i<left.length && j < right.length){
    const cmp = compareForSort(left[i], right[j]);
    if(cmp <= 0) result.push(left[i++]); else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}
function quickSort(arr){
  if(arr.length<=1) return arr;
  const pivot = arr[0];
  const less = arr.slice(1).filter(x => compareForSort(x, pivot) <= 0);
  const greater = arr.slice(1).filter(x => compareForSort(x, pivot) > 0);
  return quickSort(less).concat([pivot]).concat(quickSort(greater));
}
function applySortOrder(arr){
  if(!Array.isArray(arr)) return arr;
  return sortDescending ? [...arr].reverse() : arr;
}
function applySortAlgorithm(alg, students){
  let sorted=[];
  switch(alg){
    case 'bubble': sorted=bubbleSort([...students]); break;
    case 'insertion': sorted=insertionSort([...students]); break;
    case 'merge': sorted=mergeSort([...students]); break;
    default: sorted=quickSort([...students]); break;
  }
  return applySortOrder(sorted);
}

function makeStudent(nama, nim, ipk){ return { nama, nim, ipk } }
const students = [
  makeStudent('Charlie', '003', 3.2),
  makeStudent('alice', '001', 3.8),
  makeStudent('Bob', '002', 2.9),
  makeStudent('dave', '004', 3.5)
];

function print(title, arr){
  console.log(title, arr.map(s => `${s.nama}/${s.nim}/${s.ipk}`));
}

// Test sorting by nama
sortField = 'nama'; sortDescending = false;
print('original', students);
print('bubble', applySortAlgorithm('bubble', students));
print('insertion', applySortAlgorithm('insertion', students));
print('merge', applySortAlgorithm('merge', students));
print('quick', applySortAlgorithm('quick', students));

// Test descending
sortDescending = true;
print('bubble desc', applySortAlgorithm('bubble', students));
print('insertion desc', applySortAlgorithm('insertion', students));
print('merge desc', applySortAlgorithm('merge', students));
print('quick desc', applySortAlgorithm('quick', students));

// Test by ipk
sortField = 'ipk'; sortDescending = false;
print('by ipk bubble', applySortAlgorithm('bubble', students));
print('by ipk quick', applySortAlgorithm('quick', students));

// Test by nim
sortField = 'nim'; sortDescending = false;
print('by nim merge', applySortAlgorithm('merge', students));
print('by nim insertion', applySortAlgorithm('insertion', students));

console.log('Done');