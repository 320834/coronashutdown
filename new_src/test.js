let a = {
    "one": 1,
    "two": 2
}

let b = { ...a }

b["one"] = 100

console.log(a)

console.log(b)