"""Verifica el contrato de inferencia con el checkpoint local real."""
import asyncio
import io
import unittest
from PIL import Image
from starlette.datastructures import UploadFile, Headers
from fastapi import HTTPException
from app import main


class InferenceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        main.load_model()
        if main.model is None:
            raise unittest.SkipTest('Checkpoint local no disponible')

    def test_real_model_contract(self):
        image = io.BytesIO()
        Image.new('RGB', (224, 224), (90, 100, 110)).save(image, format='PNG')
        image.seek(0)
        upload = UploadFile(file=image, filename='fixture.png', headers=Headers({'content-type': 'image/png'}))
        result = asyncio.run(main.predict(upload))
        self.assertGreaterEqual(result.fire_probability, 0)
        self.assertLessEqual(result.fire_probability, 1)
        self.assertAlmostEqual(result.fire_probability + result.no_fire_probability, 1, places=5)
        self.assertEqual(result.detected, result.label == 'FIRE')
        # La imagen sintetica prueba ejecucion/contrato, no precision del modelo.

    def test_invalid_image(self):
        upload = UploadFile(file=io.BytesIO(b'not an image'), filename='fixture.png', headers=Headers({'content-type': 'image/png'}))
        with self.assertRaises(HTTPException) as error:
            asyncio.run(main.predict(upload))
        self.assertEqual(error.exception.status_code, 400)


if __name__ == '__main__':
    unittest.main()
