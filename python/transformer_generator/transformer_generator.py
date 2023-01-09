import json
from flask import Flask, request, Response
from transforme_keys_mapping import collect_keys

app = Flask(__name__)


@app.route('/generator/transformer', methods=['POST'])
def TransformerGenerator():
    try:
        return collect_keys(request, Response)
    except Exception as error:
        print(error)
        return Response(json.dumps({"Message": "Transformer Not Created"}))


if (__name__ == "__main__"):
    app.run(debug=True, port=3003)