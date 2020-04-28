let a = {
    "one": 1,
    "two": 2
}

let b = JSON.parse(JSON.stringify(a));

b["one"] = 100

a["two"] = 10

console.log(a)

console.log(b)