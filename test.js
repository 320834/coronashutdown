let dict = {

}

dict["one"] = 0;
dict["two"] = 1;
dict["three"] = 2;
dict["four"] = 3;

for (let [key, value] of Object.entries(dict)) {
  console.log(value)
}