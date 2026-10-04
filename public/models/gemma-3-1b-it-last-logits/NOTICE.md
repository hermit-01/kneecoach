# Gemma 3 1B graphs that score only the last position

`model_q4.onnx` and `model_q4f16.onnx` here are modified copies of the files with the same names in
[onnx-community/gemma-3-1b-it-ONNX](https://huggingface.co/onnx-community/gemma-3-1b-it-ONNX) (`onnx/` folder),
changed by Arihant Kumar on 4 Oct 2026 with `scripts/last-logits.py`.

**What changed:** one `Slice` step before the vocabulary layer (`/lm_head/MatMul_Quant`), so the model scores
only the last position of the prompt instead of every position. Text generation reads only the last position,
so answers are unchanged. The original scores a 330-token prompt against all 262,144 vocabulary entries at once,
about 350 MB of work in one step, which crashed the graphics chip on two Qualcomm phones.

These files hold only the model's structure. Its weights are not here and are not modified: the app downloads
them from the original repository.

Gemma is provided under and subject to the Gemma Terms of Use found at [ai.google.dev/gemma/terms](https://ai.google.dev/gemma/terms).
