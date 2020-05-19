# lambda-anguage
Implementing a learning only programming language. (http://lisperator.net/pltut/)

## Getting Started

```
node src/index.js lambda/test.lambda // parse code to ast
```

## Example

```
// lambda/test.lambda
sum = lambda(x, y) x + y;
print(sum(2, 3));
```

Abstract syntax tree JSON identity：

```
{
	"type": "prog",
	"prog": [{
		"type": "assign",
		"operator": "=",
		"left": {
			"type": "var",
			"value": "sum"
		},
		"right": {
			"type": "lambda",
			"vars": ["x", "y"],
			"body": {
				"type": "binary",
				"operator": "+",
				"left": {
					"type": "var",
					"value": "x"
				},
				"right": {
					"type": "var",
					"value": "y"
				}
			}
		}
	}, {
		"type": "call",
		"func": {
			"type": "var",
			"value": "print"
		},
		"args": [{
			"type": "call",
			"func": {
				"type": "var",
				"value": "sum"
			},
			"args": [{
				"type": "num",
				"value": 2
			}, {
				"type": "num",
				"value": 3
			}]
		}]
	}]
}
```

