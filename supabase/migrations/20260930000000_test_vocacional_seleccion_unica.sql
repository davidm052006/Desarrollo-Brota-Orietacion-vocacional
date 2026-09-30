DO $$
DECLARE
  nuevo_cuestionario_id UUID;
  pregunta_id UUID;
  opcion_id UUID;
  pregunta RECORD;
  area RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.cuestionarios
    WHERE nombre = 'Test vocacional Brota'
      AND version = '2.0'
      AND institucion_id IS NULL
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.cuestionarios (nombre, version, descripcion, activo, institucion_id)
  VALUES (
    'Test vocacional Brota',
    '2.0',
    '30 preguntas de selección única. Cada opción suma un punto al área de interés asociada; no hay respuestas correctas o incorrectas.',
    false,
    NULL
  )
  RETURNING id INTO nuevo_cuestionario_id;

  FOR pregunta IN
    SELECT * FROM (VALUES
      (1, 'Al participar en un proyecto nuevo, ¿qué tarea te entusiasmaría más?'),
      (2, 'Cuando algo no funciona como esperabas, ¿qué te gustaría hacer primero?'),
      (3, 'Si pudieras diseñar una actividad para tu comunidad, ¿qué enfoque elegirías?'),
      (4, '¿Qué tipo de reto te gustaría resolver durante una jornada de estudio o trabajo?'),
      (5, 'Al aprender un tema nuevo, ¿qué actividad mantendría más tu curiosidad?'),
      (6, '¿Qué responsabilidad preferirías asumir en un equipo?'),
      (7, 'Si tuvieras que presentar una idea, ¿qué parte disfrutarías preparar?'),
      (8, '¿Qué proyecto personal te gustaría comenzar en tu tiempo libre?'),
      (9, 'Al visitar una organización, ¿qué aspecto te daría más curiosidad conocer?'),
      (10, '¿Qué actividad elegirías para mejorar la vida de otras personas?'),
      (11, 'Si recibieras recursos para una iniciativa, ¿en qué te gustaría enfocarlos?'),
      (12, '¿Qué clase de información disfrutas analizar?'),
      (13, 'En una feria académica, ¿qué demostración te gustaría visitar primero?'),
      (14, '¿Qué habilidad te gustaría fortalecer este año?'),
      (15, 'Si pudieras acompañar a un grupo, ¿qué objetivo te motivaría más?'),
      (16, '¿Qué problema de tu entorno te gustaría investigar o atender?'),
      (17, 'Al organizar un evento, ¿qué parte escogerías liderar?'),
      (18, '¿Qué resultado te produciría mayor satisfacción?'),
      (19, 'Si tuvieras una semana para crear algo, ¿qué preferirías construir?'),
      (20, '¿Qué conversación te gustaría tener con una persona experta?'),
      (21, '¿Qué actividad te ayudaría a sentir que tu trabajo tiene propósito?'),
      (22, 'Cuando trabajas con otras personas, ¿qué aporte sueles disfrutar más?'),
      (23, '¿Qué tema escogerías para una investigación escolar?'),
      (24, '¿Qué espacio de aprendizaje te gustaría explorar?'),
      (25, 'Si pudieras mejorar un servicio de tu barrio o institución, ¿qué harías?'),
      (26, '¿Qué tipo de desafío te gustaría asumir en una práctica?'),
      (27, '¿Qué te gustaría que otras personas reconocieran en un proyecto tuyo?'),
      (28, 'Al imaginar tu futuro, ¿qué actividad quisieras que hiciera parte de tu día a día?'),
      (29, '¿Qué experiencia te gustaría ofrecer a otras personas?'),
      (30, '¿Cuál de estas contribuciones se parece más a lo que quisieras aportar?')
    ) AS preguntas(orden, texto)
    ORDER BY orden
  LOOP
    INSERT INTO public.preguntas (cuestionario_id, texto, tipo, orden, categoria, peso)
    VALUES (nuevo_cuestionario_id, pregunta.texto, 'single', pregunta.orden, 'intereses', 1)
    RETURNING id INTO pregunta_id;

    FOR area IN
      SELECT areas.categoria, areas.opcion,
        ((areas.posicion - ((pregunta.orden - 1) * 5) + 1400) % 14) AS orden_opcion
      FROM (VALUES
        (0, 'tecnologia', 'Crear o mejorar una herramienta digital.'),
        (1, 'salud', 'Promover el cuidado y el bienestar de las personas.'),
        (2, 'educacion', 'Explicar un tema y ayudar a otras personas a aprender.'),
        (3, 'administrativo', 'Organizar tareas, tiempos y recursos para alcanzar una meta.'),
        (4, 'ciencias', 'Investigar causas con observaciones, datos o experimentos.'),
        (5, 'juridico', 'Analizar normas y defender una solución justa.'),
        (6, 'social', 'Comprender las necesidades de una comunidad y proponer mejoras.'),
        (7, 'humanidades', 'Explorar ideas, historias y expresiones de distintas culturas.'),
        (8, 'ambiental', 'Proteger la naturaleza y reducir el impacto en el entorno.'),
        (9, 'negocios', 'Convertir una idea en una iniciativa sostenible.'),
        (10, 'diseño', 'Diseñar una experiencia visual clara y funcional.'),
        (11, 'arte', 'Crear una propuesta artística original para expresar una idea.'),
        (12, 'comunicacion', 'Contar una historia y compartirla mediante distintos medios.'),
        (13, 'deporte', 'Impulsar la actividad física, el entrenamiento o el trabajo en equipo.')
      ) AS areas(posicion, categoria, opcion)
      WHERE ((areas.posicion - ((pregunta.orden - 1) * 5) + 1400) % 14) < 5
      ORDER BY orden_opcion
    LOOP
      INSERT INTO public.opciones (pregunta_id, label, orden)
      VALUES (pregunta_id, area.opcion, area.orden_opcion)
      RETURNING id INTO opcion_id;

      INSERT INTO public.pesos_opciones (opcion_id, categoria, puntos)
      VALUES (opcion_id, area.categoria, 1);
    END LOOP;
  END LOOP;

  IF (SELECT COUNT(*) FROM public.preguntas WHERE cuestionario_id = nuevo_cuestionario_id) <> 30 THEN
    RAISE EXCEPTION 'El nuevo test vocacional debe contener exactamente 30 preguntas';
  END IF;

  IF EXISTS (
    SELECT preguntas.id
    FROM public.preguntas
    LEFT JOIN public.opciones ON opciones.pregunta_id = preguntas.id
    WHERE preguntas.cuestionario_id = nuevo_cuestionario_id
    GROUP BY preguntas.id
    HAVING COUNT(opciones.id) <> 5
  ) THEN
    RAISE EXCEPTION 'Cada pregunta del nuevo test debe tener exactamente 5 opciones';
  END IF;

  IF EXISTS (
    SELECT opciones.id
    FROM public.preguntas
    JOIN public.opciones ON opciones.pregunta_id = preguntas.id
    LEFT JOIN public.pesos_opciones ON pesos_opciones.opcion_id = opciones.id
    WHERE preguntas.cuestionario_id = nuevo_cuestionario_id
    GROUP BY opciones.id
    HAVING COUNT(pesos_opciones.id) <> 1 OR MIN(pesos_opciones.puntos) <> 1
  ) THEN
    RAISE EXCEPTION 'Cada opción debe sumar exactamente un punto en un área';
  END IF;

  UPDATE public.cuestionarios
  SET activo = false
  WHERE institucion_id IS NULL AND activo = true;

  UPDATE public.cuestionarios
  SET activo = true
  WHERE id = nuevo_cuestionario_id;
END $$;