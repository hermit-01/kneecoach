"""Make Gemma 3 1B (onnx-community export) score only the LAST position.

The export's lm_head multiplies every prompt position (1152 numbers each) by the
262,144-word vocabulary. For a 330-token prompt that is one ~350 MB, ~100 GMAC
step, which kills the graphics chip on Qualcomm phones. Text generation only
reads the last position, so a Slice right before lm_head gives the same answer.
The weights (external .onnx_data) are untouched: only the small graph changes.
"""
import sys
import onnx
from onnx import helper, TensorProto

INT64_MAX = 9223372036854775807


def externals(model):
    out = {}
    for t in model.graph.initializer:
        if t.data_location == TensorProto.EXTERNAL:
            out[t.name] = tuple((e.key, e.value) for e in t.external_data)
    return out


def last_position_only(src, dst):
    model = onnx.load(src, load_external_data=False)
    before = externals(model)
    g = model.graph
    [lm_head] = [n for n in g.node if 'logits' in n.output]
    assert lm_head.op_type == 'MatMulNBits', lm_head.op_type
    hidden = lm_head.input[0]
    users = [n.name for n in g.node if hidden in n.input]
    assert users == [lm_head.name], users  # nothing else reads the final hidden states

    g.initializer.extend([
        helper.make_tensor('kneecoach_last_starts', TensorProto.INT64, [1], [-1]),
        helper.make_tensor('kneecoach_last_ends', TensorProto.INT64, [1], [INT64_MAX]),
        helper.make_tensor('kneecoach_last_axes', TensorProto.INT64, [1], [1]),
    ])
    sliced = 'kneecoach_last_position'
    slice_node = helper.make_node(
        'Slice', [hidden, 'kneecoach_last_starts', 'kneecoach_last_ends', 'kneecoach_last_axes'], [sliced],
        name='/kneecoach/last_position/Slice',
    )
    g.node.insert(list(g.node).index(lm_head), slice_node)
    lm_head.input[0] = sliced

    [logits] = [o for o in g.output if o.name == 'logits']
    dim = logits.type.tensor_type.shape.dim[1]
    dim.Clear()
    dim.dim_value = 1
    model.metadata_props.append(onnx.StringStringEntryProto(
        key='kneecoach', value='lm_head scores the last position only (Slice before /lm_head/MatMul_Quant)'))

    assert externals(model) == before  # every weight still points at the same bytes of .onnx_data
    # No onnx.checker here: the export uses ONNX Runtime-only ops (SimplifiedLayerNormalization)
    # that the standard checker rejects even in the untouched file. ONNX Runtime is the real check.
    with open(dst, 'wb') as f:
        f.write(model.SerializeToString())
    print(f'{src} -> {dst}: {len(g.node)} nodes, {len(before)} external weights unchanged, logits dims '
          f'{[d.dim_param or d.dim_value for d in logits.type.tensor_type.shape.dim]}')


if __name__ == '__main__':
    # Usage: python scripts/last-logits.py <folder with the two original graphs> <output folder>
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    for name in ('model_q4.onnx', 'model_q4f16.onnx'):
        last_position_only(f'{src_dir}/{name}', f'{out_dir}/{name}')
